# AI Integration Plan — OpenAI `gpt-5-nano`

Research for wiring the four AI Pro features (auto-tagging, summaries, code explanation,
prompt optimization — see `context/project-overview.md` §F) into DevDrop using OpenAI's
`gpt-5-nano` model.

> **Note on the model name:** `gpt-5-nano` is a real, current OpenAI model (per
> `developers.openai.com/api/docs/models/gpt-5-nano`) — the fastest/cheapest GPT-5 variant,
> positioned for summarization, classification, and extraction, which matches all four
> features here well. A newer dated snapshot (`gpt-5.4-nano-2026-03-17`) also exists. For
> production, pin to a **dated snapshot** rather than the floating alias, so behavior/pricing
> don't shift under you on an OpenAI-side rollout — see [Model Selection](#model-selection).

---

## 1. OpenAI SDK Setup

Install the official SDK:

```bash
npm install openai
```

Add a singleton client following the exact pattern already used for `stripe`
([src/lib/stripe.ts](../src/lib/stripe.ts)) and `resend` ([src/lib/resend.ts](../src/lib/resend.ts)):

```typescript
// src/lib/openai.ts
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  maxRetries: 3, // SDK-level exponential backoff w/ jitter on 429/5xx, on top of the default 2
});

export const AI_MODEL = "gpt-5-nano-2026-03-17"; // pin a dated snapshot for prod stability
```

`OPENAI_API_KEY` is already scaffolded in [.env.example](../.env.example) (currently empty) —
no new env var name needed, just needs a real key set locally and in prod.

**Security:** the client must only ever be imported from server-only code (`src/actions/*.ts`,
`src/lib/db/*.ts`, route handlers). Never pass `openai` or the key to a Client Component or
inline it in a `NEXT_PUBLIC_*` var. This mirrors how `stripe`/`resend` are already handled —
neither is ever imported into a `"use client"` file in this codebase.

---

## 2. Server Action Patterns for AI Calls

DevDrop already has an established action shape: Zod validation → `auth()` check → Pro/limit
gating → try/catch around the mutation → `{ success, data?, error? }` return. AI actions should
follow it exactly, adding a rate-limit check (see §4) and Pro gating (see §5) before the OpenAI
call:

```typescript
// src/actions/ai.ts
"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { openai, AI_MODEL } from "@/lib/openai";
import { checkRateLimit, getClientIpFromHeaders } from "@/lib/rate-limit";

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const suggestTagsSchema = z.object({
  itemId: z.string(),
});

export async function suggestTags(
  data: z.infer<typeof suggestTagsSchema>
): Promise<ActionResult<{ tags: string[] }>> {
  const parsed = suggestTagsSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  if (!session.user.isPro) {
    return { success: false, error: "AI features require DevDrop Pro" };
  }

  const ip = getClientIpFromHeaders(await headers());
  const rateLimit = await checkRateLimit("ai-suggest-tags", `${ip}:${session.user.id}`);
  if (!rateLimit.success) {
    return { success: false, error: "Too many AI requests. Please try again shortly." };
  }

  try {
    // fetch item content scoped to session.user.id (ownership-checked, like getItemDetail)
    // ... build prompt from item content/title ...

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: "You suggest concise, lowercase tags for developer content." },
        { role: "user", content: /* sanitized item content */ "" },
      ],
      max_completion_tokens: 100,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const tags = raw.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 5);

    return { success: true, data: { tags } };
  } catch (error) {
    console.error("Failed to suggest tags:", error);
    return { success: false, error: "AI suggestion failed. Please try again." };
  }
}
```

**Why Server Actions (not API routes) for 3 of the 4 features:** per
[context/coding-standards.md](../context/coding-standards.md), API routes are reserved for
webhooks, file-upload progress, long-running ops, or third-party integrations needing specific
status codes. Auto-tagging, summaries, and prompt optimization are simple request/response
mutations triggered from a button — a textbook Server Action case, same as `updateItem`/
`createCheckoutSession`.

**Exception — Code Explanation should stream, which argues for a Route Handler:**
Server Actions can return a `ReadableStream`, but consuming a streamed *action* response from a
Client Component requires either `useActionState` (no incremental token rendering) or unofficial
patterns. A `POST /api/ai/explain` Route Handler returning a proper SSE/text stream is simpler to
consume with `fetch()` + `ReadableStream` on the client, matches the "Route Handlers for
streaming" guidance found in current Next.js/OpenAI integration writeups, and fits this
project's existing precedent of using route handlers for anything needing non-standard response
handling (`/api/download/[id]` streams a file response the same way). Recommendation:

| Feature | Mechanism | Reason |
|---|---|---|
| Auto-tagging | Server Action | Short output (a few tags), no streaming needed |
| AI summary | Server Action | Short output (1-2 sentences), no streaming needed |
| Prompt optimizer | Server Action | Short-to-medium output, better as atomic accept/reject |
| Code explanation | Route Handler (`/api/ai/explain`) + streaming | Longer prose output benefits from perceived latency reduction |

---

## 3. Streaming vs Non-Streaming

- **Non-streaming (`stream: false`, the default)** for tags, summaries, and prompt
  optimization — outputs are short (a handful of words to a couple sentences), so the UX gain
  from streaming is negligible, and Server Actions handle a single awaited response far more
  simply than a stream.
- **Streaming (`stream: true`)** for code explanation, where output can run several paragraphs.
  Use the Node SDK's async iterator form:

```typescript
// src/app/api/ai/explain/route.ts
import { auth } from "@/auth";
import { openai, AI_MODEL } from "@/lib/openai";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.user.isPro) {
    return Response.json({ error: "AI features require DevDrop Pro" }, { status: 403 });
  }

  const rateLimit = await checkRateLimit(
    "ai-explain",
    `${getClientIp(request)}:${session.user.id}`
  );
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit.reset);
  }

  const { itemId } = await request.json();
  // fetch + ownership-check item content by itemId + session.user.id here

  const stream = await openai.chat.completions.create({
    model: AI_MODEL,
    stream: true,
    messages: [
      { role: "system", content: "Explain this code snippet clearly and concisely for a developer." },
      { role: "user", content: /* sanitized content */ "" },
    ],
  });

  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const token = chunk.choices[0]?.delta?.content ?? "";
          if (token) controller.enqueue(encoder.encode(token));
        }
      } catch (error) {
        console.error("Streaming explanation failed:", error);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
```

Client-side, consume with the browser's native `fetch` + `ReadableStream` reader — no need for
the Vercel `ai` SDK given the project's small surface area (4 features, one provider). Adding it
would be a new dependency + abstraction layer for a problem this manual pattern already solves
in ~20 lines; skip it per the "don't add abstractions beyond what the task requires" guidance in
`CLAUDE.md`.

---

## 4. Error Handling and Rate Limiting

**SDK-level:** the `openai` package retries `429`/`5xx` automatically (default 2 retries,
configurable via `maxRetries`) honoring `Retry-After`. No manual backoff loop needed on top of
that — just `try/catch` around the call for the terminal failure case, exactly like every
existing action already does around Prisma/Stripe calls.

**Application-level rate limiting:** reuse [src/lib/rate-limit.ts](../src/lib/rate-limit.ts)
unchanged in shape — just add new entries to `RATE_LIMIT_CONFIGS`, keyed per-user (not just IP,
since these are authenticated, cost-bearing calls):

```typescript
const RATE_LIMIT_CONFIGS = {
  // ...existing entries...
  "ai-suggest-tags": { limit: 20, window: "1 h" },
  "ai-summarize": { limit: 20, window: "1 h" },
  "ai-explain": { limit: 15, window: "1 h" },
  "ai-optimize-prompt": { limit: 20, window: "1 h" },
} as const;
```

Key by `${ip}:${userId}` as `createCheckoutSession` already does — this caps both a single
compromised session and a shared-IP abuse case. These limits exist independently of the Stripe
plan-limit gating in §5 (rate limiting bounds *velocity/cost*; Pro gating bounds *access*).

**Error categories to distinguish** (via `error instanceof OpenAI.APIError`, which the SDK
exposes with a `.status` code):

| Case | Status | User-facing message |
|---|---|---|
| Rate-limited after SDK retries exhausted | 429 | "AI is busy right now — try again in a moment." |
| Invalid/expired API key | 401 | Log loudly server-side; generic "Something went wrong" to user (never leak key state) |
| Context length exceeded | 400 | "This content is too long to process." (truncate input before sending, see §6) |
| Content policy rejection | 400 | "Couldn't process this content." |
| Network/timeout | — | "Something went wrong. Please try again." |

Never surface raw OpenAI error messages or stack traces to the client — follow the existing
pattern in every action (`console.error` server-side, generic string to the user).

---

## 5. Pro User Gating Patterns

Per [context/project-overview.md](../context/project-overview.md) §F, all four AI features are
Pro-only. The codebase's existing gating precedent is `PRO_ONLY_TYPES` (item types) checked
against `session.user.isPro` — apply the same shape:

```typescript
// src/lib/constants/ai-features.ts
export const AI_FEATURES = ["suggest-tags", "summarize", "explain", "optimize-prompt"] as const;
export type AIFeature = (typeof AI_FEATURES)[number];
```

Gate at **both** layers, matching how file/image creation is gated in `createItem`
([src/actions/items.ts:129](../src/actions/items.ts#L129)) and mirrored client-side in
`CreateItemDialog` (`isPro` from `useSession()`, locked UI with a "PRO" badge on free-tier
options):

1. **Server (authoritative):** every AI action/route checks `session.user.isPro` before calling
   OpenAI — never trust a client-side flag alone, since `session.user.isPro` is itself re-synced
   from the DB on every JWT validation (see Stripe Phase 1 history entry), so it's safe to trust
   once past `auth()`.
2. **Client (UX only):** buttons that trigger AI actions (in `ItemDrawer`, `CreateItemDialog`)
   read `useSession().data?.user?.isPro` and render disabled/locked with a "PRO" badge for free
   users — same `locked = PRO_ONLY_TYPES.has(type) && !isPro` pattern already in
   `CreateItemDialog.tsx:144`. Clicking a locked AI button should route to `/upgrade` (already
   built) rather than silently doing nothing.

Unlike `plan-limits.ts`'s item/collection *count* limits, AI features are binary
Pro/not-Pro — no free-tier quota of AI calls, so no new `FREE_TIER_LIMITS` entry is needed. (If
usage-based Pro throttling is wanted later — e.g. capping *even Pro users* at N AI calls/day to
bound OpenAI spend — that would layer in as an additional `checkRateLimit`-style check scoped to
a daily window, decided later, out of scope here.)

---

## 6. Cost Optimization Strategies

`gpt-5-nano` is already the cheapest tier suited to this ($0.20/M input, $1.25/M output per the
GPT-5.4-nano pricing found in research — verify current pricing at purchase time), but combine
with:

- **Cap `max_completion_tokens`** on every call — tags/summaries need ~50-150 tokens, prompt
  optimization ~300-500, explanations ~500-800. Prevents runaway completions from a pathological
  input.
- **Truncate input content** before sending — cap item `content` to a reasonable character limit
  (e.g. 6-8k chars ≈ ~2k tokens) before building the prompt. Long files/snippets don't need their
  entirety to generate a tag or summary; truncate with a `"...[truncated]"` marker rather than
  erroring.
- **Low/no `temperature`** for tagging (deterministic, structured task) — reduces retry-worthy
  garbled output. Higher temperature is fine for prompt optimization (creative rewriting).
  Explanation can stay at a moderate default.
- **Rate limiting (§4)** doubles as cost control — 20 calls/hour/user bounds worst-case spend per
  account regardless of the per-call cost.
- **Structured outputs (`response_format: json_schema` or SDK's `.parse()` + `zodResponseFormat`)
  for tag suggestions** — constrains the model to emit exactly parseable JSON (e.g.
  `{ tags: string[] }`) instead of loosely-formatted prose that needs fragile string-splitting,
  cutting both retry cost from malformed parses and prompt-engineering overhead:

  ```typescript
  import { zodResponseFormat } from "openai/helpers/zod";
  import { z } from "zod";

  const TagSuggestions = z.object({ tags: z.array(z.string()).max(5) });

  const completion = await openai.chat.completions.parse({
    model: AI_MODEL,
    messages: [...],
    response_format: zodResponseFormat(TagSuggestions, "tag_suggestions"),
  });
  const { tags } = completion.choices[0].message.parsed!;
  ```

  Note: structured outputs' `json_schema` mode requires a model snapshot that supports it (all
  current GPT-5-family models do); confirm `gpt-5-nano`'s specific snapshot supports it before
  relying on `.parse()` over manual JSON parsing.
- **No caching layer needed at this scale** — DevDrop's usage pattern (a user manually clicking
  "suggest tags" on their own content) doesn't have the repeated-identical-prompt profile that
  justifies a response cache; skip that complexity unless usage data later shows otherwise.

---

## 7. UI Patterns (Loading States, Accept/Reject)

Follow the interaction patterns already established by `CodeEditor`/`MarkdownEditor`'s
copy-button (brief checkmark feedback) and `ItemDrawer`'s edit-mode Save/Cancel:

- **Trigger:** a small button near the relevant field (e.g. a `Sparkles` icon button next to the
  Tags input in `ItemDrawer` edit mode / `CreateItemDialog`, labeled "Suggest tags" /
  "Summarize" / "Explain" / "Optimize").
- **Loading state:** swap the button's icon for a spinner (`Loader2` from `lucide-react`,
  already available via shadcn conventions) and disable it — same as any existing async action
  button in this codebase (e.g. dialog Create/Save buttons already disable + could show a
  spinner during their `await` window).
- **Result presentation — accept/reject, never auto-apply:**
  - *Tags:* render suggested tags as dashed-outline "ghost" badges appended after existing tag
    badges, each individually clickable to accept (converts to a normal filled tag badge, same
    style as `CollectionPicker`'s toggle badges) or dismissible with an ✕. A blanket
    "Accept all" affordance is reasonable too.
  - *Summary:* populate the (currently empty) Description field with the suggestion but leave it
    in the editable `Input`/`Textarea` — the user edits or clears it like any other field; no
    separate accept/reject UI needed since it's already inline-editable before Save commits it.
  - *Code explanation:* render as read-only prose in a panel below/beside the code (not editable,
    it's explanatory output, not item content) — no accept/reject, just a dismiss.
  - *Prompt optimizer:* show original vs. optimized side-by-side (or diff-style) with explicit
    "Use this version" / "Keep original" buttons, since this one *replaces* the item's Content
    field — needs the clearest accept/reject of the four given the destructive-if-wrong nature.
- **Errors:** `sonner` toast, matching every other action failure in the app (`"Failed to
  update item"` style messaging) — e.g. `"AI suggestion failed. Please try again."`.
- **Streaming (explanation only):** render tokens into the panel as they arrive, with a
  simple pulsing cursor/caret at the end while `done` is false — no need for a library, just
  append each decoded chunk to local state via the `fetch` reader loop.

---

## 8. Security Considerations

- **API key handling:** `OPENAI_API_KEY` lives server-only (already scaffolded in
  `.env.example`), read only inside `src/lib/openai.ts`. Never imported by any `"use client"`
  file, never returned in any action's `data`, never logged. Same handling as `STRIPE_SECRET_KEY`
  and `RESEND_API_KEY` today.
- **Input sanitization / prompt injection:** item content is user-authored and gets interpolated
  into a prompt sent to OpenAI. Since output is either narrowly-typed (tags array via structured
  outputs) or read-only display text (explanation, summary shown for user review before it's
  ever persisted), the blast radius of a prompt-injection attempt is low — but still:
  - Never let AI output directly trigger a *side effect* (e.g. don't let a "tag suggestion"
    response silently create new collections or modify unrelated items) — the existing
    accept/reject UI in §7 already enforces this by design, since every AI output lands in a
    field the user explicitly saves.
  - For structured tag/JSON outputs, always validate the parsed response against the Zod schema
    before use (the `.parse()` helper does this) — don't trust the model to have honored
    `max: 5` etc. even under structured outputs; re-`.slice()`/re-validate server-side.
  - Truncate/cap input length (§6) — also mitigates a maliciously huge input designed to run up
    cost or hit context limits.
- **Ownership checks:** every AI action takes an `itemId` and must re-fetch that item scoped to
  `session.user.id` (the same ownership-scoped `findFirst` pattern used by `getItemDetail`,
  `updateItem`, `deleteItem`) before sending its content to OpenAI — never trust a client-supplied
  content blob directly, both to prevent cross-user data leakage into a prompt and to keep the
  gating/rate-limit checks meaningful.
- **Rate limiting as abuse/cost defense:** covered in §4 — this is a security control as much as
  a cost control, since unbounded AI calls are a billing-exhaustion vector.
- **No PII/secrets forwarding beyond what the user already stored:** DevDrop already accepts
  arbitrary snippets/notes from users, some of which may contain secrets (API keys, credentials
  pasted into a snippet). Sending that content to a third-party API (OpenAI) is inherent to the
  feature and already implied by the product (same trust boundary as e.g. GitHub Copilot or any
  cloud-based code tool) — no additional redaction is proposed here, but worth surfacing to the
  user in Settings/feature copy that AI features send item content to OpenAI, so it isn't a
  silent surprise.

---

## Model Selection

| Option | Recommendation |
|---|---|
| `gpt-5-nano` (floating) | Fine for local dev — always resolves to latest |
| `gpt-5-nano-2026-03-17` / `gpt-5.4-nano-2026-03-17` (dated snapshot) | **Use in production** — pins cost/behavior, avoids silent regressions from an OpenAI-side model swap |

Store the model id as a constant in `src/lib/openai.ts` (§1) rather than an env var — it's a
code-level decision like `apiVersion` in `src/lib/stripe.ts`, not a per-environment secret.

---

## Summary — New Files by Feature

| File | Purpose |
|---|---|
| `src/lib/openai.ts` | Singleton client + `AI_MODEL` constant |
| `src/lib/constants/ai-features.ts` | `AI_FEATURES` list (mirrors `item-types.ts` constant style) |
| `src/actions/ai.ts` | `suggestTags`, `summarizeItem`, `optimizePrompt` server actions |
| `src/app/api/ai/explain/route.ts` | Streaming code-explanation route handler |
| `src/lib/rate-limit.ts` | Add 4 new `RATE_LIMIT_CONFIGS` entries (existing file, no new module) |
| UI: `ItemDrawer`, `CreateItemDialog` | Add trigger buttons + accept/reject affordances per §7 |

No schema changes required — AI outputs land in existing `Item` fields (`content`,
`description`, `tags`) via the existing `updateItem`/`createItem` flows; nothing needs to be
persisted about the AI call itself (no history/audit table proposed, out of scope unless later
requested).

---

## Sources

- [GPT-5 nano Model | OpenAI API](https://developers.openai.com/api/docs/models/gpt-5-nano)
- [GPT-5.4 nano Model | OpenAI API](https://developers.openai.com/api/docs/models/gpt-5.4-nano)
- [Structured model outputs | OpenAI API](https://platform.openai.com/docs/guides/structured-outputs)
- [Introducing Structured Outputs in the API | OpenAI](https://openai.com/index/introducing-structured-outputs-in-the-api/)
- [Rate limits | OpenAI API](https://developers.openai.com/api/docs/guides/rate-limits)
- [Troubleshooting API rate limits and 429 errors | OpenAI Help Center](https://help.openai.com/en/articles/5955604-how-can-i-solve-429-too-many-requests-errors)
- [What are the best practices for managing my rate limits in the API? | OpenAI Help Center](https://help.openai.com/en/articles/6891753-what-are-the-best-practices-for-managing-my-rate-limits-in-the-api)
- [openai-cookbook: How to handle rate limits](https://github.com/openai/openai-cookbook/blob/main/examples/How_to_handle_rate_limits.ipynb)
- [openai-node helpers.md (Zod integration)](https://github.com/openai/openai-node/blob/master/helpers.md)
- [Streaming AI Responses in Next.js: Claude, OpenAI, and the Vercel AI SDK](https://dev.to/whoffagents/streaming-ai-responses-in-nextjs-claude-openai-and-the-vercel-ai-sdk-1gm3)
- Existing codebase: [src/lib/stripe.ts](../src/lib/stripe.ts), [src/lib/resend.ts](../src/lib/resend.ts), [src/lib/rate-limit.ts](../src/lib/rate-limit.ts), [src/actions/items.ts](../src/actions/items.ts), [src/actions/billing.ts](../src/actions/billing.ts), [src/lib/plan-limits.ts](../src/lib/plan-limits.ts)
