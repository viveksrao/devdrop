# AI Summary

## Overview

Add an AI-powered "Summarize" button next to the Description field. Clicking it generates a
concise 1-2 sentence summary from the item's current Title and Content (whatever is in the form
right now — no need to save first) and populates the Description field with it. Uses the same
OpenAI foundation (`src/lib/openai.ts`, `AI_MODEL`, Responses API) established by the AI
Auto-Tagging feature. Pro-only, gated both server-side and client-side, same as Suggest Tags.

## Requirements

- Add `summarizeItem` server action (`src/actions/ai.ts`) — auth, Pro gating, Zod validation
  (title required, content optional), rate limiting, following the exact same pattern as
  `generateAutoTags` in the same file
- Add a new `ai-summarize` rate limit config (20 requests/hour per user) to
  `src/lib/rate-limit.ts`, alongside the existing `ai-suggest-tags` entry
- Uses the OpenAI Responses API (`openai.responses.create`) exactly like `generateAutoTags` —
  NOT Chat Completions (gpt-5-nano returns empty content under Chat Completions)
- Truncate content to 2000 chars before the API call (same limit as auto-tagging)
- Works for all item types (snippet, prompt, command, note, link, file, image) — build the
  prompt from whatever title/content/url is currently available in the form; a File/Image item
  has no text content, so the summary should be based on title alone in that case
- Add a "Summarize" icon button (Sparkles icon, ghost variant, ai-summarize icon distinct enough
  from the Suggest Tags button — reuse the same visual language) next to/above the Description
  field in both the Create Item dialog and Item Drawer edit mode
- On click, the returned summary directly replaces/populates the Description field's current
  value (no accept/reject UI — the field is already editable inline, matching the pattern
  documented for AI summaries in `docs/ai-integration-plan.md` §7) — this differs from Suggest
  Tags' accept/reject badges by design
- Hide the Summarize button for free users (Pro-only UI gating), same `isPro` plumbing already
  threaded through `CreateItemDialog`/`ItemDrawer`/`ItemEditForm`
- Loading state: disable the button and change its label while awaiting the response (matches
  existing convention in this codebase — no spinner component precedent, see Suggest Tags)
- Error handling via toast (Pro gating, rate limit, AI service errors) — same messaging
  conventions as `generateAutoTags`
- Follow existing patterns; keep `TagSuggestions`/new summary component separate rather than
  merging them, since their result-presentation UX differs (badges vs. direct field replacement)
- Unit tests for the new server action, mirroring `src/actions/ai.test.ts`'s coverage of
  `generateAutoTags`

## Notes

- `OPENAI_API_KEY` already in `.env`, `src/lib/openai.ts` and `AI_MODEL` already exist (built by
  the AI Auto-Tagging feature) — no new client setup needed
- `isPro` is already available in `CreateItemDialog` (via `useSession()`) and now in `ItemDrawer`
  → `ItemEditForm` (threaded through as a prop by the AI Auto-Tagging feature) — reuse both,
  no new plumbing needed
- Reuse the same `json_object` response-format gotcha fix from Suggest Tags: the OpenAI Responses
  API's `text.format: { type: "json_object" }` mode requires the literal word "json" to appear in
  the input text, not just conceptually implied by the instructions — include an explicit
  "Respond with json only" (or similar) line in the prompt input
- Suggested response shape: `{ "summary": "..." }` (single string), parsed similarly to the tags
  parsing in `generateAutoTags` (handle both a JSON object and a bare string response defensively)
- See `docs/ai-integration-plan.md` §7 for the UI pattern precedent (summary populates the
  Description field directly, no separate accept/reject step) and §2/§4/§5 for the general
  server-action/rate-limit/Pro-gating shape already established by `generateAutoTags`
