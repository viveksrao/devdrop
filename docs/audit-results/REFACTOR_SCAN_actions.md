# Refactor Scan: src/actions

**Last scanned:** 2026-09-15
**Files reviewed:** 5 (`items.ts`, `collections.ts`, `billing.ts`, `user.ts`, `ai.ts`) — test files (`*.test.ts`) were consulted for context but are not the target of extraction findings.

## Summary

`src/actions` consistently follows the project's Zod → auth → gate → rate-limit → Prisma → `{ success, data, error }` convention, which is expected and not flagged. Within that convention there are three genuine, mechanical duplications worth extracting: an identical inline `getClientIpFromHeaders` helper reimplemented in two files instead of reusing `src/lib/rate-limit.ts`, an identical 3-line session-check block repeated 15 times across all 5 files, and (as a judgment call, per project history) a near-identical Pro-gate+rate-limit preamble and OpenAI JSON-response-parsing pattern repeated 4 times in `ai.ts`. None of these require large signature changes — each is a small, low-risk extraction.

## Findings

### 1. Duplicated `getClientIpFromHeaders` helper (should reuse `src/lib/rate-limit.ts`)

- **Occurrences:**
  - `src/actions/billing.ts:17-23`
  - `src/actions/ai.ts:19-25`
- **What's duplicated:** Byte-identical function:
  ```ts
  function getClientIpFromHeaders(headerList: Awaited<ReturnType<typeof headers>>): string {
    const forwardedFor = headerList.get("x-forwarded-for");
    if (forwardedFor) {
      return forwardedFor.split(",")[0].trim();
    }
    return headerList.get("x-real-ip") ?? "unknown";
  }
  ```
  This exists because `src/lib/rate-limit.ts` already has `getClientIp(request: Request)`, but server actions don't have a `Request` object available (they only have `headers()` from `next/headers`), so each action file reinvented an equivalent for the `Headers`-based case instead of adding a shared variant to `rate-limit.ts`. The project history (Stripe Phase 1) even notes this was a deliberate one-off at the time; it has since been copy-pasted into a second file (`ai.ts`) rather than promoted to a shared helper.
- **Proposed extraction:** Add `getClientIpFromHeaderList(headerList: Headers): string` to `src/lib/rate-limit.ts` alongside the existing `getClientIp`, and have both `billing.ts` and `ai.ts` import it instead of declaring their own copy. Signature stays trivial (single `Headers` param), so no over-abstraction risk.
- **Impact:** Removes ~14 duplicated lines across 2 files; prevents a third AI/billing-style action from re-copying it again (there are already 4 call sites of the duplicated function combined).

### 2. Repeated `auth()` + "Unauthorized" session-check boilerplate

- **Occurrences (all 15 exported action functions, all identical 3-line block):**
  - `src/actions/items.ts:87-90`, `124-127`, `185-188`, `205-208`, `225-228`
  - `src/actions/collections.ts:42-45`, `75-78`, `102-105`, `122-125`
  - `src/actions/billing.ts:28-31`, `76-79`
  - `src/actions/user.ts:31-34`
  - `src/actions/ai.ts:94-97`, `182-185`, `269-272`, `323-326`
- **What's duplicated:** The exact block:
  ```ts
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }
  ```
  repeated verbatim 15 times with no variation in wording or logic — this is precisely the `requireSession()`/`requireAuth()` candidate called out in the category brief.
- **Proposed extraction:** Add a small helper to a new or existing shared actions-support file, e.g. `src/lib/auth-helpers.ts`:
  ```ts
  export async function requireSession(): Promise<
    { session: Session; error?: undefined } | { session?: undefined; error: string }
  > {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };
    return { session };
  }
  ```
  Each action would replace its 4-line block with:
  ```ts
  const { session, error } = await requireSession();
  if (error) return { success: false, error };
  ```
  This keeps the existing `{ success, data, error }` return convention untouched (only the internal auth check is extracted), so it doesn't conflict with coding-standards.md.
- **Impact:** Removes ~45 lines of exact repetition across 5 files and centralizes the one place session-shape logic (e.g. `session?.user` vs `session?.user?.id`) would ever need to change.

### 3. Repeated Pro-gate + rate-limit preamble in `ai.ts` (judgment call)

- **Occurrences:**
  - `src/actions/ai.ts:99-107` (`summarizeItem`)
  - `src/actions/ai.ts:187-195` (`explainCode`)
  - `src/actions/ai.ts:274-282` (`optimizePrompt`)
  - `src/actions/ai.ts:328-336` (`generateAutoTags`)
- **What's duplicated:** Immediately after the session check (Finding 2), every AI action repeats:
  ```ts
  if (!session.user.isPro) {
    return { success: false, error: "AI features require DevDrop Pro" };
  }

  const ip = getClientIpFromHeaders(await headers());
  const rateLimit = await checkRateLimit("<rate-limit-name>", `${ip}:${session.user.id}`);
  if (!rateLimit.success) {
    return { success: false, error: "Too many AI requests. Please try again shortly." };
  }
  ```
  varying only in the `RateLimitName` string literal. This is the exact "Pro-gating checks... rate-limit key construction" pattern flagged by the category brief, and per `context/current-feature.md` these four actions are noted as intentionally mirroring each other — but with a 4th near-identical copy now in place, the preamble itself (not the OpenAI call that follows it) is cheap to extract without disturbing each action's distinct prompt/parsing logic.
- **Proposed extraction:** A small helper in `src/lib/ai-guard.ts` (or colocated in `src/actions/ai.ts` since it's only used there today):
  ```ts
  async function requireProAiAccess(
    session: Session,
    rateLimitName: RateLimitName
  ): Promise<{ error?: string }> {
    if (!session.user.isPro) return { error: "AI features require DevDrop Pro" };
    const ip = getClientIpFromHeaders(await headers());
    const rateLimit = await checkRateLimit(rateLimitName, `${ip}:${session.user.id}`);
    if (!rateLimit.success) return { error: "Too many AI requests. Please try again shortly." };
    return {};
  }
  ```
  Each action calls `const { error } = await requireProAiAccess(session, "ai-summarize"); if (error) return { success: false, error };`.
- **Impact:** Removes ~28 lines of near-identical logic across 4 functions in one file; keeps each action's distinct OpenAI prompt/instructions and response-parsing untouched. Judgment call: this is a small, 2-parameter helper (not over-abstracted), and unlike Finding 4 below, it doesn't touch the part of the codebase the project has explicitly chosen to keep duplicated (prompt-building), so it's lower-risk to extract than a full `callOpenAiJson()`.

## Not Flagged (Judgment Calls)

- **The `{ success, data, error }` return shape and the local `interface ActionResult<T>` declaration** (repeated in all 5 files): the shape itself is an explicit project convention per `context/coding-standards.md` and must not be flagged. The `interface ActionResult<T> { success: boolean; data?: T; error?: string; }` type declaration is technically copy-pasted 5 times and *could* move to `src/types/`, but it's 4 lines, changes essentially never, and centralizing it would only save a few lines while adding a cross-file type dependency for something this trivial — not worth the churn.
- **Full OpenAI request-building + JSON-response-parsing (`parseSummaryFromResponse`/`parseExplanationFromResponse`/`parseOptimizedPromptFromResponse`/`parseTagsFromResponse`, and the `openai.responses.create({ instructions, input, text: { format: { type: "json_object" } } })` calls) in `ai.ts`:** these are structurally similar (try/catch → JSON.parse → bare-value-or-keyed-object check) and now appear 4 times, which is exactly the threshold the category brief says makes a shared `callOpenAiJson()` in `src/lib/openai.ts` worth considering. However, per `context/current-feature.md`, this mirroring is a **deliberate, repeated decision** across four separate feature passes (AI Auto-Tagging → AI Summary → AI Explain Code → Prompt Optimizer) — each action's `instructions` prompt, expected JSON key, and truncation/language handling differ enough that a generic helper would need a response-key parameter, an instructions-builder parameter, and possibly a generic-type parameter, pushing toward the "over-abstraction" line the ground rules warn against. Flagging the smaller, mechanical Pro-gate/rate-limit preamble (Finding 3) captures most of the easy win without forcing this larger, more debatable extraction. Left as an explicit judgment call for the user rather than a hard finding.
- **`canCreateItem`/`canCreateCollection` Pro/plan-limit gating in `items.ts`/`collections.ts`:** both already delegate to the shared `src/lib/plan-limits.ts` helpers as intended — no ad-hoc reimplementation found.
- **CRUD schema shapes (`createItemSchema` vs `updateItemSchema`, `createCollectionSchema` vs `updateCollectionSchema`):** these differ meaningfully (create requires `itemTypeName`/file fields with type-specific `refine`s; update allows nullable fields) and are appropriately entity-specific, not duplicated boilerplate.
