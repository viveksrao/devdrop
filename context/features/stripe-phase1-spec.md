# Stripe Integration — Phase 1: Core Infrastructure

## Overview

Lay the groundwork for DevDrop Pro billing: the Stripe SDK client, free-tier limit constants, billing data access, the `isPro` JWT/session sync, and the server actions that create Stripe Checkout and Billing Portal sessions. This phase is API/data-layer only — no webhook handler and no UI. Full details and code samples: @docs/stripe-integration-plan.md.

## Requirements

- Install the `stripe` npm package
- `src/lib/stripe.ts` — singleton `Stripe` client + `STRIPE_PRICE_IDS` (monthly/yearly) + `BillingInterval` type
- `src/lib/constants/plan-limits.ts` — `FREE_TIER_LIMITS` (`maxItems: 50`, `maxCollections: 3`) as the single source of truth
- `src/lib/db/billing.ts` — Prisma queries: `getUserBillingInfo`, `findUserByStripeCustomerId`, `setUserStripeCustomerId`, `setUserSubscriptionStatus`
- `src/actions/billing.ts` — `createCheckoutSession(interval)` and `createBillingPortalSession()` server actions, following the existing `{ success, data?, error? }` action pattern (`auth()` check, try/catch, `console.error` on failure)
- `src/auth.ts` — update the `jwt` callback to re-sync `isPro` from the DB on every token validation (JWT sessions can't otherwise reflect a webhook-driven DB change); update the `session` callback to expose `isPro`
- `src/types/next-auth.d.ts` — augment `Session.user.isPro: boolean` and `JWT.isPro?: boolean`
- `.env.example` — add `NEXT_PUBLIC_APP_URL` (used by checkout/portal redirect URLs)
- `src/lib/rate-limit.ts` — add a `checkout: { limit: 10, window: "1 h" }` entry to `RATE_LIMIT_CONFIGS`, applied inside `createCheckoutSession`

## Environment Variables

```
STRIPE_SECRET_KEY=""
STRIPE_PUBLISHABLE_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_PRICE_ID_MONTHLY=""
STRIPE_PRICE_ID_YEARLY=""
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

(First five already scaffolded in `.env.example` from the prior "Stripe Sandbox Setup" commit — only `NEXT_PUBLIC_APP_URL` is new. Real test-mode values need to be created in the Stripe Dashboard: product + monthly/yearly prices, then API keys — see plan §6 steps 1–3. `STRIPE_WEBHOOK_SECRET` is filled in during Phase 2.)

## Unit Tests

Per `context/coding-standards.md`, only `src/actions/` and `src/lib/` are unit-tested (colocated `*.test.ts`, `prismaMock` for DB access, no real network/DB calls):

- `src/lib/db/billing.test.ts` — all four query functions from `src/lib/db/billing.ts`, mirroring the existing `src/lib/db/items.test.ts` pattern
- `src/lib/plan-limits.test.ts` — `canCreateItem`/`canCreateCollection`:
  - Pro users return `true` immediately without querying the DB
  - Free users compare the current count against `FREE_TIER_LIMITS`, including the exact boundary (49 vs 50 items, 2 vs 3 collections)
- `src/actions/billing.test.ts` — `createCheckoutSession`/`createBillingPortalSession`, mocking `@/lib/stripe` (`vi.mock("@/lib/stripe")`) and `@/lib/db/billing`:
  - Rejects unauthenticated requests
  - `createCheckoutSession` short-circuits with an error when the user is already Pro
  - Rate-limit rejection returns the expected error shape
  - Stripe API errors are caught and return a generic error string (not leaked to the client)

Note: `src/lib/plan-limits.ts` itself (the `canCreateItem`/`canCreateCollection` helpers) is listed here as part of Phase 1's testable surface, but wiring it into `createItem`/`createCollection` (the actual gating) is Phase 2 scope — see the Phase 2 spec.

## Out of Scope (Phase 2)

- Webhook handler (`src/app/api/webhooks/stripe/route.ts`)
- Feature gating wired into `createItem`/`createCollection`/`POST /api/upload`
- `BillingSection` UI component and Settings page wiring
- `getUserProfile()` exposing `isPro`
- Anything requiring `stripe listen`/Stripe CLI to verify

## Notes

- No Prisma migration needed — `isPro`/`stripeCustomerId`/`stripeSubscriptionId` already exist on `User`.
- The `jwt` callback change adds one indexed `findUnique` per session validation — a cheap primary-key lookup, acceptable overhead for correctness. Verify in-browser that manually flipping `isPro=true` via Neon SQL (`development` branch) is reflected in the session after a reload, **before** starting Phase 2 — this isolates the JWT-sync fix from checkout/webhook complexity.
- `createCheckoutSession` reads `headers()` for client-IP rate limiting — the one place a server action needs request headers, since server actions don't receive a `Request` object directly.
