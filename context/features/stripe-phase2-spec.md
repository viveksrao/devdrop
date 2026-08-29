# Stripe Integration — Phase 2: Integration & UI

## Overview

Build on Phase 1's infrastructure (`isPro` session sync, `src/lib/stripe.ts`, billing actions) to deliver the end-to-end subscription flow: the webhook handler that reacts to Stripe events, free-tier/Pro-only feature gating enforced in the actual mutation paths, and the Settings billing UI. Requires `stripe listen` (Stripe CLI) for local webhook testing. Full details and code samples: @docs/stripe-integration-plan.md.

## Prerequisites

- Phase 1 complete and verified (`isPro` correctly reflected in session after a manual DB flip)
- Stripe Dashboard test-mode product + monthly/yearly prices created, keys in `.env.local`
- Stripe CLI installed (`brew install stripe/stripe-cli/stripe` or equivalent)

## Requirements

### Webhook Handler

- `src/app/api/webhooks/stripe/route.ts` — `POST` handler:
  - Reads the **raw body** via `request.text()` before any parsing (required for Stripe signature verification — do not add body-parsing middleware in front of this route)
  - Verifies the `stripe-signature` header via `stripe.webhooks.constructEvent`; missing/invalid signature → 400, no DB writes
  - Handles `checkout.session.completed` (sets `isPro: true` + `stripeSubscriptionId`), `customer.subscription.updated` (syncs `isPro` from subscription status — `active`/`trialing` = Pro), `customer.subscription.deleted` (sets `isPro: false`, clears `stripeSubscriptionId`)
  - try/catch around the whole handler, `console.error` + 500 on unexpected failure — no rate limiting (Stripe calls this, not a user)
  - Idempotent by construction (unconditional `update`, safe to process the same event twice)

### Feature Gating

- `src/lib/plan-limits.ts` — `canCreateItem(userId, isPro)` / `canCreateCollection(userId, isPro)` (built in Phase 1, wired in here)
- `src/actions/items.ts` — `createItem` gains: Pro-only-type check (`PRO_ONLY_TYPES.has(itemTypeName) && !isPro` → error) and free-tier item-count check, both placed after the existing auth check
- `src/actions/collections.ts` — `createCollection` gains the free-tier collection-count check, same placement pattern
- `src/app/api/upload/route.ts` — reject with 403 when `!session.user.isPro` (File/Image uploads are Pro-only)
- `src/components/dashboard/CreateItemDialog.tsx` — read `isPro` via `useSession()`; disable File/Image type-selector buttons for free users with a "Pro" badge (matching the sidebar's existing PRO badge treatment), rather than hiding them

### Billing UI

- `src/lib/db/user.ts` — `getUserProfile()` gains an `isPro` field (mirrors the existing `hasPassword` pattern)
- `src/components/settings/BillingSection.tsx` — client component:
  - Free: "Upgrade to Pro" with Monthly/Yearly `Switch` toggle (reuse `PricingSection.tsx`'s pattern) → `createCheckoutSession(interval)` → `window.location.href = result.data.url`
  - Pro: "Manage subscription" → `createBillingPortalSession()` → same redirect
  - Mirrors `ChangePasswordForm`/`EditorPreferencesForm`'s client-component + server-action + `sonner` toast pattern
- `src/app/settings/page.tsx` — add a Billing `Card` section, placed after "Editor preferences" and before "Change password"

## Stripe Dashboard / CLI Setup

1. Local webhook forwarding: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`, copy the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET`
2. For deployed environments: Dashboard → Developers → Webhooks → add endpoint at `https://<domain>/api/webhooks/stripe`, subscribed to `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
3. Enable the Customer Portal (Settings → Billing → Customer portal) — allow cancel + payment-method update; leave plan-switching off unless desired
4. Use `stripe trigger customer.subscription.deleted` to simulate cancellation without waiting on a real event

## Manual / In-Browser Testing (Stripe CLI + test card `4242 4242 4242 4242`)

Not unit-tested — this phase is verified live, per `context/coding-standards.md`'s scope (only `src/actions/`/`src/lib/` get unit tests; the webhook route and UI flows are excluded):

- [ ] Free user hits 50 items → `createItem` returns the limit error, dialog surfaces it via toast
- [ ] Free user hits 3 collections → `createCollection` returns the limit error
- [ ] Free user attempts a File/Image item → blocked with the Pro upsell message; type selector shows disabled state
- [ ] Settings → Billing shows "Free" plan with Monthly/Yearly upgrade toggle
- [ ] "Upgrade to Pro" (monthly) redirects to Checkout with the correct $8/mo price; (yearly) with $72/yr
- [ ] Completing checkout redirects to `/settings?checkout=success`; **after a reload**, `isPro` is `true`, Billing section shows "Pro" + "Manage subscription"
- [ ] `stripe listen` logs (or Neon SQL, `development` branch) confirm `checkout.session.completed` set `stripeCustomerId`/`stripeSubscriptionId`/`isPro=true` on the right user
- [ ] Post-upgrade: item/collection limits no longer enforced; File/Image types selectable and upload succeeds
- [ ] "Manage subscription" opens the Customer Portal for the correct customer
- [ ] Cancel in the Portal (or `stripe trigger customer.subscription.deleted`) → webhook flips `isPro=false`, reload reflects it
- [ ] POST to `/api/webhooks/stripe` with a bad/missing `stripe-signature` → 400, no DB writes
- [ ] Re-send an already-processed event via the Dashboard's "Resend" → idempotent, no duplicate errors
- [ ] Seeded demo user (`demo@devstash.io`, 18 items / 5 collections, well under both limits) unaffected by gating changes

## Out of Scope

- AI feature gating / export gating — not yet built
- Proration or in-app plan-switching UI — Customer Portal handles cancel/payment-method updates
- `past_due` grace-period handling — current logic treats anything non-`active`/`trialing` as immediately not-Pro
- `stripeCurrentPeriodEnd`/`stripePriceId` columns for a richer "renews on" UI — follow-up migration if/when prioritized
- Production webhook endpoint registration — do before flipping DNS/going live, not part of this dev-scoped phase
