# Refactor Scan: src/components

**Last scanned:** 2026-09-15
**Files reviewed:** 76 (all `.tsx`/`.ts` files under `src/components/**`, including `ui/`, `dashboard/`, `layout/`, `auth/`, `profile/`, `marketing/`, `settings/`, `upgrade/`, `shared/`, `providers/`)

## Summary

`src/components/ui/**` (shadcn primitives) is clean — no duplication, expected reuse. Outside of that, there's a meaningful amount of copy-pasted logic concentrated in a few recurring shapes: (1) the favorite-toggle handler duplicated identically across three item-card components, (2) the AI-action-button/copy-to-clipboard/tab-switcher scaffolding shared between `CodeEditor` and `MarkdownEditor`, (3) two pairs of near-identical dialogs/sections (`CreateCollectionDialog`/`EditCollectionDialog`, `BillingSection`/`UpgradePricing`), and (4) auth-form boilerplate (GitHub button + OR divider, fetch-JSON-and-toast pattern) repeated across 5 files in `src/components/auth/` and `src/components/profile/`. Separately, three components (`ItemDrawer`, `CreateItemDialog`, `DashboardSidebar`) have grown to mix several distinct concerns — data-fetching-adjacent state, multiple dialog/tab states, and multiple unrelated UI sections — and are good candidates for splitting. Altogether there are 10 duplication findings and 3 oversized-component findings below.

## Findings

### 1. Identical favorite-toggle handler duplicated across item cards
- **Occurrences:**
  - `src/components/dashboard/ItemCard.tsx:L27-L42` (`isTogglingFavorite` state + `handleToggleFavorite`)
  - `src/components/dashboard/ImageCard.tsx:L20-L35`
  - `src/components/dashboard/FileListItem.tsx:L29-L45`
- **What's duplicated:** The exact same 15-line block: a `useState` for `isTogglingFavorite`, an `async function handleToggleFavorite(e)` that calls `e.stopPropagation()`, guards against double-clicks, calls `toggleItemFavorite(item.id)`, toasts on failure, and calls `router.refresh()` on success. Byte-for-byte identical in all three files aside from surrounding formatting.
- **Proposed extraction:** A `useToggleItemFavorite(itemId: string)` hook returning `{ isToggling, toggleFavorite }`, placed in `src/hooks/useToggleItemFavorite.ts` (see the Hooks note below — `src/hooks/` doesn't exist yet, this would be its first file) or, if the project prefers not to introduce a hooks folder yet, as a plain exported function `toggleItemFavoriteWithToast` next to the other card components. Given React conventions and the "extract reusable logic into custom hooks" coding standard, a hook is the better fit.
- **Impact:** Removes ~45 duplicated lines across 3 files down to ~15 lines in one hook + 3 one-line call sites; prevents the toast copy or refresh behavior from drifting between card types.

### 2. Copy-to-clipboard-with-checkmark-timeout duplicated again in a 4th/5th place
- **Occurrences:**
  - `src/components/dashboard/CodeEditor.tsx:L106-L110` (`handleCopy`)
  - `src/components/dashboard/MarkdownEditor.tsx:L46-L50` (`handleCopy`)
  - `src/components/dashboard/ItemCard.tsx:L44-L66` (`handleCopy`, fetches item detail first, same checkmark-timeout tail)
  - `src/components/dashboard/ItemDrawer.tsx:L110-L124` (`handleCopy`)
- **What's duplicated:** `navigator.clipboard.writeText(...)` → `setCopied(true)` → `setTimeout(() => setCopied(false), 1500)`, each paired with a local `copied`/`setCopied` state declared per component. This is the exact pattern the project history already flagged as recurring (`CodeEditor`/`MarkdownEditor`/`ItemCard`) but a 4th occurrence (`ItemDrawer`) has since been added without extraction.
- **Proposed extraction:** `useCopyToClipboard(timeoutMs = 1500)` hook returning `{ copied, copy: (text: string) => Promise<void> }`, in `src/hooks/useCopyToClipboard.ts`. `ItemCard`'s copy handler still needs its own fetch-then-copy wrapper, but it can call the hook's `copy()` for the clipboard+state part instead of managing `copied`/`setTimeout` itself.
- **Impact:** Removes ~20 lines of duplicated timeout/state bookkeeping across 4 files; centralizes the 1.5s timeout constant so it can't silently diverge (already implicitly consistent at 1500ms in all four, but only by coincidence of copy-paste).

### 3. AI-action button (Sparkles/Crown/Loader2 + Pro-gated tooltip) duplicated between CodeEditor and MarkdownEditor
- **Occurrences:**
  - `src/components/dashboard/CodeEditor.tsx:L170-L194` (Explain button + tooltip)
  - `src/components/dashboard/MarkdownEditor.tsx:L115-L139` (Optimize button + tooltip)
- **What's duplicated:** Identical `Tooltip`/`TooltipTrigger`/`Button` structure: icon-only ghost button showing `Loader2` (spinning) while loading, `Crown` when `!isPro`, otherwise `Sparkles`; wrapped in a `Tooltip` that only renders `TooltipContent` "AI features require Pro subscription" when `!isPro`. Also identical is the `toast.error("AI features require Pro subscription")` early-return guard at the top of `handleExplain`/`handleOptimize`, and the `TabButton` sub-component (lines 256-278 in `CodeEditor.tsx` and lines 199-221 in `MarkdownEditor.tsx`) is character-for-character identical.
- **Proposed extraction:**
  - Extract `TabButton` (currently duplicated verbatim) into a shared `src/components/dashboard/EditorTabButton.tsx` and import it from both files.
  - Extract the Pro-gated AI-action button into `src/components/dashboard/AiActionButton.tsx` with props `{ isPro: boolean; isLoading: boolean; onClick: () => void }`, encapsulating the icon-selection logic and the conditional tooltip.
- **Impact:** Removes ~25 duplicated lines for `TabButton` and ~20 for the AI button across the two editor components; any future third editor (e.g. if File/Image content ever gets an AI action) can reuse both instead of copy-pasting a third time.

### 4. `CreateCollectionDialog` and `EditCollectionDialog` are near-identical
- **Occurrences:**
  - `src/components/dashboard/CreateCollectionDialog.tsx:L20-L111` (entire file)
  - `src/components/dashboard/EditCollectionDialog.tsx:L20-L114` (entire file)
- **What's duplicated:** Both render an identical `Dialog`/`DialogContent` with Name (`Input`, autofocus) + Description (`Textarea`) fields, an identical `FormState` shape, an identical Cancel/Save-or-Create footer gated on `!form.name.trim()`, and identical `toast.error(...)`/`toast.success(...)`/`router.refresh()` handling. The only real differences are: the server action called (`createCollection` vs `updateCollection`), the dialog copy ("New collection" vs "Edit collection"), and whether the form is seeded from an existing `collection` prop.
- **Proposed extraction:** A single `CollectionFormDialog` component in `src/components/dashboard/CollectionFormDialog.tsx` accepting `{ mode: "create" | "edit"; collection?: {...}; open; onOpenChange }`, internally branching only on the action call and copy strings. Alternatively, keep two thin wrapper components (to preserve the current `CreateCollectionDialog`/`EditCollectionDialog` call sites and prop names used by `DashboardShell`/`CollectionActionsMenu`) that both render a new shared `CollectionFormFields`/`useCollectionForm` internal.
- **Impact:** Removes ~70 duplicated lines down to roughly 90 lines total in one shared implementation instead of ~200 across two files; any future field added to collections (e.g. a color or icon) only needs to be added once.

### 5. `BillingSection` and `UpgradePricing` duplicate the Free/Pro pricing card markup and toggle
- **Occurrences:**
  - `src/components/settings/BillingSection.tsx:L1-L86` (whole file — plan badge + inline monthly/yearly toggle + upgrade button)
  - `src/components/upgrade/UpgradePricing.tsx:L1-L114` (whole file — full pricing cards including the same `FREE_FEATURES`/`PRO_FEATURES` arrays)
- **What's duplicated:** The `FREE_FEATURES`/`PRO_FEATURES` string arrays are copied verbatim (compare `UpgradePricing.tsx:L12-L27` to `BillingSection`'s absent-but-conceptually-overlapping plan copy, and to `PricingSection.tsx:L11-L21` in marketing — a third near-identical copy of the same two arrays). The monthly/yearly `Switch` + "Save 25%" badge + `handleUpgrade`/`createCheckoutSession` call is duplicated verbatim between `BillingSection` and `UpgradePricing` (compare `BillingSection.tsx:L19-L31` to `UpgradePricing.tsx:L33-L45` — identical function body).
- **Proposed extraction:**
  - Move `FREE_FEATURES`/`PRO_FEATURES` into a single shared constant, e.g. `PLAN_FEATURES` in `src/lib/constants/plan-limits.ts` (which already owns `FREE_TIER_LIMITS` per project history), imported by `BillingSection`, `UpgradePricing`, and marketing's `PricingSection`.
  - Extract a `useUpgradeCheckout()` hook (`{ isYearly, setIsYearly, isSubmitting, handleUpgrade }`) in `src/hooks/useUpgradeCheckout.ts`, used by both `BillingSection` and `UpgradePricing` instead of each redefining `handleUpgrade`.
  - Consider a shared `PricingCards` presentational component (`src/components/shared/PricingCards.tsx`) that both `UpgradePricing` and marketing's `PricingSection` render, parameterized by CTA target (`register` vs checkout action) — lower priority since the marketing version has different visual styling (dark marketing theme vs dashboard theme), so full merge may cost more readability than it saves; extracting just the feature-list constant is the safer win there.
- **Impact:** Removes ~35 duplicated lines of toggle/checkout logic between `BillingSection`/`UpgradePricing`, plus de-duplicates a 15-line feature list copied in 3 places total.

### 6. Auth forms: GitHub button + "OR" divider duplicated
- **Occurrences:**
  - `src/components/auth/SignInForm.tsx:L94-L109`
  - `src/components/auth/RegisterForm.tsx:L72-L87`
- **What's duplicated:** Identical `Button` (`variant="outline"`, full width, `disabled={isGitHubLoading}`, "Redirecting..." / "Sign in with GitHub" label swap) followed by an identical `Separator`/`"OR"`/`Separator` row. The `handleGitHubSignIn` function bodies are also identical apart from the `redirectTo` value (`callbackUrl` vs the hardcoded `"/dashboard"`).
- **Proposed extraction:** A shared `GitHubSignInButton` component in `src/components/auth/GitHubSignInButton.tsx` accepting `redirectTo: string`, encapsulating the loading state, click handler, and the divider markup (or export the divider separately as `OrDivider` if it's ever needed without the button). 
- **Impact:** Removes ~30 duplicated lines across the two forms; keeps future auth-page additions (e.g. a Google provider) from re-copying the same scaffold a third time.

### 7. Auth/profile forms: repeated fetch-JSON-and-toast submit pattern
- **Occurrences:**
  - `src/components/auth/ResetPasswordForm.tsx:L44-L78`
  - `src/components/auth/ForgotPasswordForm.tsx:L20-L47`
  - `src/components/auth/RegisterForm.tsx:L41-L69`
  - `src/components/profile/ChangePasswordForm.tsx:L28-L62`
  - `src/components/profile/DeleteAccountDialog.tsx:L27-L40`
- **What's duplicated:** Each handler follows: `setIsSubmitting(true)` → `fetch(url, { method, headers: {"Content-Type":"application/json"}, body: JSON.stringify(...) })` → `const json = await res.json()` → `setIsSubmitting(false)` → `if (!json.success) { setError/toast.error(...); return }` → success toast/redirect. The Zod client-side validation (`safeParse` → `setError(parsed.error.issues[0].message)`) is also repeated identically in `ResetPasswordForm`, `ForgotPasswordForm`, `RegisterForm`, and `ChangePasswordForm`.
- **Proposed extraction:** A small `postJson<T>(url: string, body: unknown): Promise<{ success: boolean; data?: T; error?: string }>` utility in `src/lib/api-client.ts`, used by all five forms to replace the repeated `fetch`/`headers`/`JSON.stringify`/`res.json()` boilerplate. A second small helper, `getFirstZodError(parsed: SafeParseReturnType)`, could dedupe the `parsed.error.issues[0].message` extraction, though this one is small enough (~1 line) that it may not be worth a dedicated abstraction on its own — bundling it into `postJson`'s call sites is optional.
- **Impact:** Removes ~10-12 lines of `fetch` boilerplate per form (~50 lines total across 5 files); this is presentation-layer code, not a server action or lib utility per the project's testing conventions, so this extraction wouldn't need new unit tests, but would reduce the chance of a future form forgetting the `Content-Type` header or the `success` check.

### 8. `TagSuggestions` and `SummarizeButton` duplicate the "no title" guard and AI-call/toast handling shape
- **Occurrences:**
  - `src/components/dashboard/TagSuggestions.tsx:L21-L46`
  - `src/components/dashboard/SummarizeButton.tsx:L19-L44`
- **What's duplicated:** Both start with `if (!title.trim()) { toast.error("Add a title before ..."); return; }`, then `setIsLoading(true)` → call an AI server action → `setIsLoading(false)` → `if (!result.success) { toast.error(result.error ?? "AI ... failed. Please try again."); return; }` → a final data-shape check before using `result.data`. This mirrors the `callOpenAiJson()` judgment call flagged for `src/lib/openai.ts` — on the component side, the pattern is now repeated in exactly 2 places, which is below the 3+ threshold this scan uses to recommend extraction, so it's noted here but not strongly pushed.
- **Proposed extraction (optional/judgment call):** If a third AI-trigger button is added (e.g. wrapping `explainCode`/`optimizePrompt` the same way `CodeEditor`/`MarkdownEditor` currently do inline), consider a `useAiAction<T>(action, { requireTitle })` hook in `src/hooks/useAiAction.ts`. Given only 2 occurrences today and the project's stated preference (per `ai-interaction.md` history) for explicit duplication over premature shared abstractions in the AI code paths, this is left as a watch-item rather than a firm finding.
- **Impact:** If extracted, would remove ~15 duplicated lines between the two files; low urgency at the current count of 2.

### 9. Marketing/dashboard "gradient CTA button" className string repeated 4 times
- **Occurrences:**
  - `src/components/marketing/HeroSection.tsx:L27-L30`
  - `src/components/marketing/CTASection.tsx:L20-L23`
  - `src/components/marketing/PricingSection.tsx:L96-L100`
  - `src/components/marketing/MarketingNavbar.tsx:L54-L57` and `:L107-L111` (mobile sheet variant)
  - `src/components/upgrade/UpgradePricing.tsx:L102-L105` (same gradient classes, different component tree)
- **What's duplicated:** The literal Tailwind class string `"bg-gradient-to-br from-blue-500 to-indigo-500 ... shadow-[0_4px_20px_rgba(59,130,246,0.35)] hover:from-blue-500 hover:to-indigo-500 hover:opacity-90"` appears verbatim 5 times.
- **Proposed extraction:** A `GRADIENT_CTA_CLASSES` (or a `buttonVariants`-style `gradientCta: cn(...)` addition) constant in `src/lib/utils.ts` or a new `src/lib/constants/marketing.ts`, imported wherever the gradient button is rendered.
- **Impact:** Cosmetic/low-risk — removes a ~1-line-but-120-character string duplicated 5 times; mainly prevents the gradient from silently drifting if updated in only some call sites (already borderline over-engineering for a single className, included for completeness rather than as a high-priority item).

### 10. `FavoriteCollectionsSection`/`FavoriteItemsSection` share sort-dropdown scaffolding
- **Occurrences:**
  - `src/components/dashboard/FavoriteCollectionsSection.tsx:L40-L76`
  - `src/components/dashboard/FavoriteItemsSection.tsx:L45-L81`
- **What's duplicated:** Both render an identical section header (`<h2>` count + conditional `Select` sort dropdown shown only when `length > 1`) and an identical empty-state / `divide-y` row-list wrapper. The sort *option sets* differ (dates+name vs dates+name+type) so the `sortItems`/`sortCollections` functions are legitimately different, not duplicated — only the surrounding section chrome is.
- **Proposed extraction:** A generic `SortableListSection<T>` wrapper component in `src/components/dashboard/SortableListSection.tsx` taking `{ title, count, sortOptions, sortLabels, sort, onSortChange, items, renderRow, emptyMessage }`. Given this needs a couple of generic type parameters and a render-prop, weigh this against the "over-abstraction" guardrail — with only 2 call sites and fairly small duplicated chrome (~15 lines), this is a judgment call; a mild win but not urgent.
- **Impact:** If extracted, removes ~20 duplicated lines of header/empty-state chrome between the two files.

---

## Oversized Components

### A. `ItemDrawer` mixes data-fetching, two dialog states, and view/edit-mode switching in one 382-line file
- **File:** `src/components/dashboard/ItemDrawer.tsx`
- **What's mixed together:**
  1. Data fetching for the open item (`useEffect` fetching `/api/items/[id]`, loading-state derivation) — lines 73-97.
  2. A second, separate on-demand fetch for `/api/collections` triggered from `handleStartEdit` — lines 130-136.
  3. Edit-mode state machine: `isEditing`, `editForm`, `editingForItemId`, `isSaving`, plus `toEditFormState` mapping — lines 34-44, 126-176.
  4. Copy-to-clipboard state/handler — lines 63, 110-124 (also flagged in Finding 2).
  5. Favorite-toggle and pin-toggle state/handlers (each with its own optimistic-update logic) — lines 65-66, 178-213.
  6. Delete confirmation `AlertDialog` inlined directly in JSX — lines 295-321.
  7. The action-bar JSX itself (view mode vs edit mode toolbars) — lines 255-323.
  8. A `formatRelativeTime` pure utility function defined at module scope — lines 366-381.
  9. An `ItemDrawerSkeleton` sub-component — lines 347-364.
- **Proposed split:**
  - Extract `formatRelativeTime` to `src/lib/format-date.ts` (pure utility, testable, and a natural home per the coding standards' `src/lib/[utility].ts` convention — also removes it from a client component file entirely).
  - Extract `ItemDrawerSkeleton` to `src/components/dashboard/ItemDrawerSkeleton.tsx` (already structurally standalone, just needs to move).
  - Extract the view-mode action bar (Copy/Edit/Favorite/Pin/Delete buttons + the delete `AlertDialog`) into `src/components/dashboard/ItemDrawerActionBar.tsx`, taking `{ item, onCopy, copied, onEdit, onToggleFavorite, isTogglingFavorite, onTogglePin, isTogglingPin, onDelete, isDeleting }` as props. This alone removes ~90 lines of JSX from the parent.
  - Extract the favorite/pin/copy state+handlers into a `useItemDrawerActions(item, setItem)` hook (or reuse Finding 1/2's `useCopyToClipboard`/`useToggleItemFavorite` hooks directly, plus a new small `useToggleItemPin` following the same shape) to shrink the remaining state block.
  - Keep `ItemDrawer` itself as the orchestrator: fetch-on-open, decide loading/edit/view mode, and compose `ItemDrawerActionBar` + `ItemEditForm`/`ItemDetailView`.
- **Impact:** Would shrink `ItemDrawer.tsx` from ~382 lines to roughly 150-180 lines focused purely on orchestration; the extracted action bar and skeleton become independently readable/testable-by-inspection units, and the favorite/pin/copy hooks become reusable by the card components in Findings 1-2 as well.

### B. `CreateItemDialog` mixes type-selector UI, per-type conditional field rendering, and file-upload/AI-suggestion wiring in one 307-line file
- **File:** `src/components/dashboard/CreateItemDialog.tsx`
- **What's mixed together:**
  1. The type-selector segmented-button grid (icon + label + PRO lock badge per creatable type) — lines 149-182.
  2. Per-type conditional field rendering (Description+Summarize, Language, Content, URL, File upload, Tags+Suggestions, Collections) — lines 184-285, which is almost line-for-line the same conditional structure as `ItemEditForm.tsx:L47-L138` (the same five conditionals: `LANGUAGE_TYPES.has(...)`, `TEXT_CONTENT_TYPES.has(...)`, `itemTypeName === "link"`, `FILE_TYPES.has(...)`, tags+`CollectionPicker`), just with `FormState` instead of `ItemEditFormState` and an added file-upload branch.
  3. Form/file/collection state management and the `handleCreate` submit handler with its own validation (title required, file required for file-types, URL required for link) — lines 77-136.
- **Proposed split:**
  - Extract the type-selector grid into `src/components/dashboard/ItemTypeSelector.tsx` taking `{ types, value, onChange, isPro }` — directly reusable if a second creation surface (e.g. a future "quick add" command-palette action) is ever built.
  - Extract the shared per-type field block (Description/Language/Content/URL/Tags/Collections — everything except the File upload branch, which only `CreateItemDialog` needs since `ItemEditForm` doesn't support changing an existing item's file) into a shared `ItemFormFields` component in `src/components/dashboard/ItemFormFields.tsx`, parameterized by `{ itemTypeName, form, onChange, isPro, allCollections }` plus an optional `fileSlot?: React.ReactNode` render prop for `CreateItemDialog` to inject its `FileUpload` block between Content and Tags. This directly eliminates the duplication between `CreateItemDialog`'s field JSX and `ItemEditForm.tsx` (same 5 conditionals, ~90 lines each).
  - Keep `CreateItemDialog` itself focused on: dialog open/close state, the type selector, the file/collections top-level state, and `handleCreate`'s validation/submit.
- **Impact:** Would shrink `CreateItemDialog.tsx` from ~307 lines to roughly 120-140 lines, and reduce `ItemEditForm.tsx` from 141 lines to a thin wrapper around the new shared `ItemFormFields`, eliminating ~90 lines of near-duplicate conditional field JSX between the two files (this is both a size fix and a duplication fix in one).

### C. `DashboardSidebar` combines branding header, two independent list sections, an upsell banner, and a generic `SidebarLink`/`SidebarSection` mini-framework in one 277-line file
- **File:** `src/components/layout/DashboardSidebar.tsx`
- **What's mixed together:**
  1. The sidebar shell/header (logo + collapse-aware width) — lines 58-78.
  2. The "Types" section rendering — lines 80-106.
  3. The "Collections" section rendering (including its own "New collection" action button, currently inert with no `onClick`) — lines 110-156.
  4. The Pro-upsell banner — lines 159-166.
  5. `SidebarUserFooter` composition + the collapse-toggle button — lines 168-183.
  6. Two generic reusable sub-components, `SidebarSection` and `SidebarLink` (with its own collapsed/tooltip branching), defined at module scope in the same file — lines 188-277.
- **What's not a real problem:** `SidebarSection`/`SidebarLink` being defined in the same file as their only consumer is a common, reasonable React pattern and not inherently oversized on its own — this finding is about the *sidebar body* (types + collections + upsell banner) growing alongside them.
- **Proposed split:**
  - Move `SidebarSection` and `SidebarLink` into their own file, `src/components/layout/SidebarLink.tsx` (exporting both, since `SidebarSection` is a thin layout wrapper only used alongside `SidebarLink`), so `DashboardSidebar.tsx` imports them instead of defining them inline. This alone removes ~90 lines from the main file.
  - Extract the "Types" list rendering into `src/components/layout/SidebarTypesSection.tsx` taking `{ itemTypes, pathname }`.
  - Extract the "Collections" list rendering into `src/components/layout/SidebarCollectionsSection.tsx` taking `{ collections, pathname }`.
  - Extract the Pro-upsell banner into `src/components/layout/SidebarUpgradeBanner.tsx` (trivial, but keeps `DashboardSidebar`'s JSX focused on composition).
- **Impact:** Would shrink `DashboardSidebar.tsx` from ~277 lines to roughly 60-80 lines of pure composition, with each extracted section independently readable and reusable (e.g. if a future "manage types" settings page wants to reuse the same type-list rendering).

## Not Flagged (Judgment Calls)

- **shadcn/ui primitives in `src/components/ui/`** — every file follows the same Base UI wrapper pattern (`data-slot`, `cn(...)`, forwarded props). This is intentional, generated-by-convention code, not duplication to fix.
- **Every dialog using shadcn `Dialog`/`AlertDialog`** (`CreateCollectionDialog`, `EditCollectionDialog`, `CreateItemDialog`, `DeleteAccountDialog`, `ItemDrawer`'s delete confirmation, `CollectionActionsMenu`'s delete confirmation) — expected reuse of a shared UI primitive, not duplication.
- **`TagSuggestions`/`SummarizeButton` AI-call shape (Finding 8)** — only 2 occurrences; per the project's own history the AI action code intentionally mirrors itself rather than sharing an abstraction (`generateAutoTags`/`summarizeItem`/`explainCode`/`optimizePrompt` server actions already do this on purpose). Noted as a watch-item, not a firm recommendation.
- **Marketing section components (`HeroSection`, `FeaturesSection`, `AISection`, `PricingSection`, `CTASection`) each rendering a `ScrollFadeIn`-wrapped section** — this is the intended, already-extracted shared abstraction (`ScrollFadeIn`) doing its job; no further duplication here.
- **`src/hooks/`** — this folder does not exist yet in the codebase. Findings 1, 2, and 8 above (and the drawer/card action logic in Oversized Finding A) are exactly the kind of state+effect logic that should live there once created; this scan surfaces them as the concrete first candidates for that folder rather than recommending an empty scaffold.
- **`ItemCard`, `ImageCard`, `FileListItem` overall card layout** — despite sharing the favorite-toggle logic (Finding 1), their JSX structure (bordered card vs image thumbnail vs file row) is genuinely different per type and was not flagged as duplicated markup — only the toggle handler was.
