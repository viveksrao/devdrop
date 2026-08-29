# Stripe Subscription Integration Plan — DevDrop Pro

**Pricing:** $8/mo monthly · $72/yr annual (25% savings), already reflected in `PricingSection.tsx`.

---

## 1. Current State Analysis

### 1.1 User model (`prisma/schema.prisma`)

The schema is already Stripe-ready — nothing to add here:

```prisma
model User {
  ...
  isPro                Boolean  @default(false)
  stripeCustomerId     String?  @unique
  stripeSubscriptionId String?  @unique
  ...
}
```

No migration needed for Phase 1. (A later phase may want a `stripePriceId`/`stripeCurrentPeriodEnd` for richer billing UI — see §7 "Future considerations".)

### 1.2 NextAuth v5 setup

- Split-config pattern: `src/auth.config.ts` (edge-safe providers) + `src/auth.ts` (full config, `PrismaAdapter`, JWT strategy).
- Session strategy is **JWT**, not database sessions — so `isPro` must be threaded through the `jwt`/`session` callbacks, it can't just be read fresh from the DB on every request the way a DB-session strategy would allow.
- Current callbacks (`src/auth.ts:34-41`):
  ```typescript
  jwt: ({ token, user }) => {
    if (user) token.id = user.id;
    return token;
  },
  session: ({ session, token }) => {
    if (token.id) session.user.id = token.id as string;
    return session;
  },
  ```
- `src/types/next-auth.d.ts` currently only augments `Session.user.id`.

**This is exactly the gap the research prompt's note calls out.** Because sessions are JWT-based, a webhook that flips `isPro` in Postgres has no way to reach an already-issued JWT except by re-deriving it. The prescribed fix — always re-sync `isPro` from the DB inside the `jwt` callback — is the correct approach for this codebase and is folded into §3.2 below.

### 1.3 How user data is accessed

- Server components call `auth()` directly (e.g. `src/app/settings/page.tsx:12`, `src/app/dashboard/page.tsx`) and then hit Prisma via `src/lib/db/*.ts` query modules.
- Server actions (`src/actions/*.ts`) all follow one shape: `auth()` → Zod-validate input → call a `src/lib/db/*.ts` function → return `{ success, data?, error? }`.
- Client components needing user state read `useSession()` (e.g. avatar/profile dropdown) — so `session.user.isPro` becomes available to client components for free once added to the session callback and the `next-auth.d.ts` augmentation.

### 1.4 Existing subscription/payment code

None. `git log` shows a single prior commit ("Stripe Sandbox Setup") that only added placeholder env vars to `.env.example`:

```
STRIPE_SECRET_KEY=""
STRIPE_PUBLISHABLE_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_PRICE_ID_MONTHLY=""
STRIPE_PRICE_ID_YEARLY=""
```

No `stripe` npm package is installed yet. This is a greenfield integration.

---

## 2. Feature Gating Analysis

### 2.1 Free tier limits (from `context/project-overview.md`)

| Limit | Free | Pro |
|---|---|---|
| Items | 50 total | Unlimited |
| Collections | 3 | Unlimited |
| File/Image types | ❌ | ✅ |
| AI features | ❌ | ✅ |
| Export (JSON/ZIP) | ❌ | ✅ |

Per `context/project-overview.md`: *"During development, all users can access all features. Pro gating will be enabled before launch."* — so **no gating currently exists in code**. `isPro`/`PRO_ONLY_TYPES` exist as data/constants but nothing reads them to block an action today.

### 2.2 Where counts are/could be checked

- **Item count**: `getItemStats()` in `src/lib/db/items.ts:387-394` already does `prisma.item.count({ where: { userId } })` for the dashboard stat card. The exact same count is the natural gate check for item creation.
- **Collection count**: `getCollectionStats()` in `src/lib/db/collections.ts:130-137` does the equivalent `prisma.collection.count({ where: { userId } })`.
- **Enforcement point**: both `createItem` (`src/actions/items.ts:114`) and `createCollection` (`src/actions/collections.ts`) are server actions that already call `auth()` first — the natural place to add a limit check is right after the session check, before the Zod-validated data hits the DB layer.

### 2.3 Pro-only features already in the codebase

- `PRO_ONLY_TYPES = new Set(["file", "image"])` in `src/lib/constants/item-types.ts:33` — currently informational only; `CreateItemDialog` and `/items/[type]` do not check it.
- File/Image types (§ File Upload feature) go through `POST /api/upload` (`src/app/api/upload/route.ts`) with no Pro check.
- AI auto-tagging/summaries/explain/prompt-optimizer: **not yet built** — no code to gate yet.
- Export (JSON/ZIP): **not yet built** — no code to gate yet.
- Custom item types: **not yet built**.

### 2.4 Settings page structure

`src/app/settings/page.tsx` is a server component rendering stacked `Card` sections (Editor preferences → Change password [conditional] → Danger zone), each backed by its own client-component form. A **Billing** section fits the same pattern — a new `Card` between "Editor preferences" and "Change password", backed by a new `BillingSection` client component. `getUserProfile()` (`src/lib/db/user.ts`) is the natural place to add `isPro`/`stripeCustomerId`/`stripeSubscriptionId` fields, mirroring how it already exposes `hasPassword`.

---

## 3. API & Webhook Patterns to Follow

### 3.1 API route conventions (from `src/app/api/upload/route.ts`, `register/route.ts`)

- Plain `Request`/`NextResponse.json`, no App Router route handlers helpers beyond that.
- Session-gated routes: `const session = await auth(); if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });`
- Validation before any side effect; specific 400s with a `success:false` + `error` string body.
- `try/catch` wraps the whole handler in routes that touch external services (`register/route.ts:23-80`), logging via `console.error` and returning a generic `{ success: false, error: "Something went wrong" }` on unexpected failure — **the Stripe webhook route should follow this same try/catch/log shape**, since webhook handlers are exactly this kind of "talks to an external service" code.
- Rate limiting is applied via `checkRateLimit(name, key)` + `rateLimitResponse(reset)` from `src/lib/rate-limit.ts` for anything user-triggered and abusable (register, password reset, etc.) — checkout-session creation is user-triggered and should get the same treatment; the webhook route should **not** be rate-limited (Stripe, not a user, calls it).

### 3.2 Server action conventions

- `"use server"` file top; Zod schema per action; `interface ActionResult<T> { success: boolean; data?: T; error?: string }`; `auth()` check; try/catch around the DB call; `console.error` + generic error string on failure.
- New billing actions (`createCheckoutSession`, `createBillingPortalSession`) should follow this exactly, mirroring `src/actions/user.ts`'s shape (no complex payload validation needed — the "payload" is really just "which price ID").

### 3.3 Environment variable pattern

`.env.example` already lists the five Stripe vars needed (see §1.4). Each existing integration (`R2_*`, `UPSTASH_*`) reads `process.env.X` directly inside a small `src/lib/<service>.ts` singleton module — Stripe should follow the same shape: a `src/lib/stripe.ts` exporting a singleton `Stripe` client, analogous to `src/lib/r2.ts`'s S3 client singleton.

---

## 4. Files to Create

### 4.1 `src/lib/stripe.ts` — Stripe client singleton

```typescript
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
  typescript: true,
});

export const STRIPE_PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_ID_MONTHLY!,
  yearly: process.env.STRIPE_PRICE_ID_YEARLY!,
} as const;

export type BillingInterval = keyof typeof STRIPE_PRICE_IDS;
```

### 4.2 `src/lib/constants/plan-limits.ts` — free-tier limits (single source of truth)

```typescript
export const FREE_TIER_LIMITS = {
  maxItems: 50,
  maxCollections: 3,
} as const;
```

### 4.3 `src/lib/db/billing.ts` — Prisma queries for billing state

```typescript
import { prisma } from "@/lib/prisma";

export async function getUserBillingInfo(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { isPro: true, stripeCustomerId: true, stripeSubscriptionId: true },
  });
}

export async function findUserByStripeCustomerId(customerId: string) {
  return prisma.user.findUnique({ where: { stripeCustomerId: customerId } });
}

export async function setUserStripeCustomerId(userId: string, stripeCustomerId: string) {
  return prisma.user.update({ where: { id: userId }, data: { stripeCustomerId } });
}

export async function setUserSubscriptionStatus(
  userId: string,
  data: { isPro: boolean; stripeSubscriptionId: string | null }
) {
  return prisma.user.update({ where: { id: userId }, data });
}
```

Unit-testable following the existing `src/lib/db/*.test.ts` pattern with `prismaMock`.

### 4.4 `src/actions/billing.ts` — server actions

```typescript
"use server";

import { auth } from "@/auth";
import { stripe, STRIPE_PRICE_IDS, type BillingInterval } from "@/lib/stripe";
import { getUserBillingInfo, setUserStripeCustomerId } from "@/lib/db/billing";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { headers } from "next/headers";

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function createCheckoutSession(
  interval: BillingInterval
): Promise<ActionResult<{ url: string }>> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const ip = getClientIp(new Request("http://x", { headers: await headers() }));
  const rateLimit = await checkRateLimit("checkout", `${ip}:${session.user.id}`);
  if (!rateLimit.success) {
    return { success: false, error: "Too many attempts. Please try again shortly." };
  }

  try {
    const billing = await getUserBillingInfo(session.user.id);
    if (billing?.isPro) {
      return { success: false, error: "You already have an active subscription" };
    }

    let customerId = billing?.stripeCustomerId ?? undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email ?? undefined,
        metadata: { userId: session.user.id },
      });
      customerId = customer.id;
      await setUserStripeCustomerId(session.user.id, customerId);
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: STRIPE_PRICE_IDS[interval], quantity: 1 }],
      success_url: `${APP_URL}/settings?checkout=success`,
      cancel_url: `${APP_URL}/settings?checkout=cancelled`,
      client_reference_id: session.user.id,
    });

    if (!checkoutSession.url) {
      return { success: false, error: "Something went wrong" };
    }

    return { success: true, data: { url: checkoutSession.url } };
  } catch (error) {
    console.error("Failed to create checkout session:", error);
    return { success: false, error: "Something went wrong" };
  }
}

export async function createBillingPortalSession(): Promise<ActionResult<{ url: string }>> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  try {
    const billing = await getUserBillingInfo(session.user.id);
    if (!billing?.stripeCustomerId) {
      return { success: false, error: "No billing account found" };
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: billing.stripeCustomerId,
      return_url: `${APP_URL}/settings`,
    });

    return { success: true, data: { url: portalSession.url } };
  } catch (error) {
    console.error("Failed to create billing portal session:", error);
    return { success: false, error: "Something went wrong" };
  }
}
```

Add a `checkout: { limit: 10, window: "1 h" }` entry to `RATE_LIMIT_CONFIGS` in `src/lib/rate-limit.ts` (see §5.4).

> Note: `createCheckoutSession` uses `headers()` only to extract client IP for rate limiting, matching the pattern in API routes; this is the one place a server action needs request headers since Next.js server actions don't receive a `Request` object directly.

### 4.5 `src/app/api/webhooks/stripe/route.ts` — webhook handler

```typescript
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { findUserByStripeCustomerId, setUserSubscriptionStatus } from "@/lib/db/billing";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        const customerId = checkoutSession.customer as string;
        const subscriptionId = checkoutSession.subscription as string;

        const user = await findUserByStripeCustomerId(customerId);
        if (user) {
          await setUserSubscriptionStatus(user.id, {
            isPro: true,
            stripeSubscriptionId: subscriptionId,
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const user = await findUserByStripeCustomerId(customerId);
        if (user) {
          const isActive = subscription.status === "active" || subscription.status === "trialing";
          await setUserSubscriptionStatus(user.id, {
            isPro: isActive,
            stripeSubscriptionId: isActive ? subscription.id : null,
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const user = await findUserByStripeCustomerId(customerId);
        if (user) {
          await setUserSubscriptionStatus(user.id, {
            isPro: false,
            stripeSubscriptionId: null,
          });
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`Failed to handle Stripe webhook event ${event.type}:`, error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
```

**Critical:** this route must read the **raw body** (`request.text()`) before any JSON parsing — Stripe's signature check fails on a re-serialized body. Next.js App Router route handlers give you the raw `Request`, so `request.text()` is correct as written; do not add a global body-parsing middleware in front of this route.

### 4.6 `src/lib/plan-limits.ts` — shared limit-check helpers

```typescript
import { prisma } from "@/lib/prisma";
import { FREE_TIER_LIMITS } from "@/lib/constants/plan-limits";

export async function canCreateItem(userId: string, isPro: boolean): Promise<boolean> {
  if (isPro) return true;
  const count = await prisma.item.count({ where: { userId } });
  return count < FREE_TIER_LIMITS.maxItems;
}

export async function canCreateCollection(userId: string, isPro: boolean): Promise<boolean> {
  if (isPro) return true;
  const count = await prisma.collection.count({ where: { userId } });
  return count < FREE_TIER_LIMITS.maxCollections;
}
```

### 4.7 `src/components/settings/BillingSection.tsx` — client component

Renders current plan (Free/Pro badge), and either:
- **Free**: "Upgrade to Pro" with a Monthly/Yearly toggle (reuse the `Switch` pattern from `PricingSection.tsx`) → calls `createCheckoutSession(interval)`, redirects `window.location.href = result.data.url`.
- **Pro**: "Manage subscription" button → calls `createBillingPortalSession()`, redirects the same way.

Mirrors `ChangePasswordForm`/`EditorPreferencesForm`'s client-component + server-action + `sonner` toast pattern already used elsewhere in Settings.

### 4.8 Tests

- `src/lib/db/billing.test.ts` — mirrors `src/lib/db/items.test.ts`'s `prismaMock` pattern for the four functions in §4.3.
- `src/actions/billing.test.ts` — mirrors `src/actions/items.test.ts`, mocking `@/lib/stripe`'s `stripe` export (`vi.mock("@/lib/stripe")`) and `@/lib/db/billing`, asserting auth-gating, already-Pro short-circuit, and error handling.
- `src/lib/plan-limits.test.ts` — asserts `canCreateItem`/`canCreateCollection` return `true` for Pro users without querying, and correctly compare counts against `FREE_TIER_LIMITS` for free users (via `prismaMock`).

The webhook route itself is **not** unit-tested per the project's testing scope (`context/coding-standards.md`: only `src/actions/` and `src/lib/`) — it's verified via Stripe CLI event forwarding instead (see §6).

---

## 5. Files to Modify

### 5.1 `src/auth.ts` — sync `isPro` into the JWT on every validation

Per the research prompt's explicit guidance, replace the `jwt` callback:

```typescript
jwt: async ({ token, user }) => {
  if (user) token.id = user.id;

  if (token.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: token.id as string },
      select: { isPro: true },
    });
    token.isPro = dbUser?.isPro ?? false;
  }

  return token;
},
session: ({ session, token }) => {
  if (token.id) session.user.id = token.id as string;
  session.user.isPro = (token.isPro as boolean) ?? false;
  return session;
},
```

This adds one indexed `findUnique` per session validation (every server-rendered page load and every `useSession()`-triggered refetch). Given `User.id` is the primary key, this is a cheap point lookup — acceptable overhead for correctness. A page reload after Stripe checkout redirect is then sufficient to reflect the new Pro status, exactly as the research notes describe.

### 5.2 `src/types/next-auth.d.ts` — expose `isPro` on the session type

```typescript
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isPro: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    isPro?: boolean;
  }
}
```

### 5.3 `.env.example` — add the app URL var used by checkout/portal redirects

```diff
 # Stripe
 STRIPE_SECRET_KEY=""
 STRIPE_PUBLISHABLE_KEY=""
 STRIPE_WEBHOOK_SECRET=""
 STRIPE_PRICE_ID_MONTHLY=""
 STRIPE_PRICE_ID_YEARLY=""
+NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 5.4 `src/lib/rate-limit.ts` — add a `checkout` config

```diff
 const RATE_LIMIT_CONFIGS = {
   login: { limit: 5, window: "15 m" },
   register: { limit: 3, window: "1 h" },
   "forgot-password": { limit: 3, window: "1 h" },
   "reset-password": { limit: 5, window: "15 m" },
   "resend-verification": { limit: 3, window: "15 m" },
+  checkout: { limit: 10, window: "1 h" },
 } as const;
```

### 5.5 `src/actions/items.ts` — gate `createItem` on the free-tier item limit and Pro-only types

```diff
+import { canCreateItem } from "@/lib/plan-limits";
+import { PRO_ONLY_TYPES } from "@/lib/constants/item-types";
+
 export async function createItem(
   data: CreateItemPayload
 ): Promise<ActionResult<ItemDetail>> {
   const parsed = createItemSchema.safeParse(data);
   if (!parsed.success) {
     return { success: false, error: parsed.error.issues[0].message };
   }

   const session = await auth();
   if (!session?.user) {
     return { success: false, error: "Unauthorized" };
   }

+  if (PRO_ONLY_TYPES.has(parsed.data.itemTypeName) && !session.user.isPro) {
+    return { success: false, error: "Files and images require DevDrop Pro" };
+  }
+
+  if (!(await canCreateItem(session.user.id, session.user.isPro))) {
+    return { success: false, error: "You've reached the 50-item limit on the free plan" };
+  }
+
   try {
```

### 5.6 `src/actions/collections.ts` — gate `createCollection` on the free-tier collection limit

```diff
+import { canCreateCollection } from "@/lib/plan-limits";
+
 export async function createCollection(
   data: CreateCollectionPayload
 ): Promise<ActionResult<CollectionWithStats>> {
   ...
   const session = await auth();
   if (!session?.user) {
     return { success: false, error: "Unauthorized" };
   }

+  if (!(await canCreateCollection(session.user.id, session.user.isPro))) {
+    return { success: false, error: "You've reached the 3-collection limit on the free plan" };
+  }
+
   try {
```

*(Exact line numbers depend on the current file — apply as a logical insertion after the auth check, matching `createItem`'s placement.)*

### 5.7 `src/app/api/upload/route.ts` — gate file/image uploads behind Pro

```diff
   const session = await auth();
   if (!session?.user) {
     return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
   }

+  if (!session.user.isPro) {
+    return NextResponse.json(
+      { success: false, error: "File and image uploads require DevDrop Pro" },
+      { status: 403 }
+    );
+  }
+
   const formData = await request.formData();
```

### 5.8 `src/components/dashboard/CreateItemDialog.tsx` — hide/disable Pro-only types for free users

Read `session.user.isPro` via `useSession()`; for the type-selector buttons where `PRO_ONLY_TYPES.has(type.name)` and `!isPro`, either disable the button with a "Pro" badge (mirroring the sidebar's existing PRO badge treatment in `DashboardSidebar.tsx`) or keep them visible-but-disabled with a tooltip linking to `/settings`. Disabled-with-upsell is preferable to hidden, so free users discover the feature exists.

### 5.9 `src/app/settings/page.tsx` — add the Billing section

```diff
+import { BillingSection } from "@/components/settings/BillingSection";
...
+      <section>
+        <Card>
+          <CardHeader>
+            <CardTitle>Billing</CardTitle>
+          </CardHeader>
+          <CardContent>
+            <BillingSection isPro={profile.isPro} />
+          </CardContent>
+        </Card>
+      </section>
+
       {profile.hasPassword && (
```

Place it directly after "Editor preferences", before "Change password" — billing is account-level, same tier as password management, and above the destructive "Danger zone".

### 5.10 `src/lib/db/user.ts` — expose `isPro` from `getUserProfile()`

Add `isPro: true` to the `select` in `getUserProfile()` and to its return type, following the existing pattern for `hasPassword`.

### 5.11 `package.json` — add the `stripe` SDK

```bash
npm install stripe
```

---

## 6. Stripe Dashboard Setup Steps

1. **Create the product** — Dashboard → Product catalog → "+ Add product". Name: "DevDrop Pro".
2. **Add two prices** on that product:
   - Recurring, $8.00 USD, Monthly → copy the price ID into `STRIPE_PRICE_ID_MONTHLY`.
   - Recurring, $72.00 USD, Yearly → copy the price ID into `STRIPE_PRICE_ID_YEARLY`.
3. **Get API keys** — Developers → API keys (Test mode). Copy the Secret key into `STRIPE_SECRET_KEY`, Publishable key into `STRIPE_PUBLISHABLE_KEY` (publishable key isn't strictly needed for this Checkout-redirect-based flow, but keep it for future Stripe.js/Elements use).
4. **Set up the webhook endpoint**:
   - For local dev: run `stripe listen --forward-to localhost:3000/api/webhooks/stripe`, copy the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET`.
   - For deployed environments: Developers → Webhooks → "+ Add endpoint", URL = `https://<your-domain>/api/webhooks/stripe`, subscribe to events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`. Copy that endpoint's signing secret into the deployed environment's `STRIPE_WEBHOOK_SECRET`.
5. **Enable the Customer Portal** — Settings → Billing → Customer portal. Turn it on, configure allowed actions (cancel subscription, update payment method; leave "switch plans" off unless you want mid-cycle monthly↔yearly switching), and set the business info/branding shown to customers.
6. **(Optional) Enable tax collection** — Settings → Tax, if you plan to charge sales tax/VAT. Out of scope for Phase 1 but worth flagging before launch.

---

## 7. Testing Checklist

### Automated (per `npm test`)
- [ ] `src/lib/db/billing.test.ts` — all four query functions, prismaMock
- [ ] `src/actions/billing.test.ts` — auth gating, already-Pro short-circuit, rate-limit rejection, Stripe error handling (mocked)
- [ ] `src/lib/plan-limits.test.ts` — Pro bypass, free-tier boundary (49 vs 50 items, 2 vs 3 collections)
- [ ] Updated `src/actions/items.test.ts` — `createItem` rejects Pro-only types for free users, rejects over-limit free users
- [ ] Updated `src/actions/collections.test.ts` — `createCollection` rejects over-limit free users
- [ ] `npm run lint` and `npm run build` pass

### Manual / in-browser (Stripe test mode, test card `4242 4242 4242 4242`)
- [ ] Free user hits 50 items → `createItem` returns the limit error, dialog surfaces it via toast
- [ ] Free user hits 3 collections → `createCollection` returns the limit error
- [ ] Free user attempts a File/Image item → blocked with the Pro upsell message; type selector shows disabled state
- [ ] Settings → Billing shows "Free" plan with Monthly/Yearly upgrade toggle
- [ ] Clicking "Upgrade to Pro" (monthly) redirects to Stripe Checkout with the correct $8/mo price
- [ ] Clicking "Upgrade to Pro" (yearly) redirects to Stripe Checkout with the correct $72/yr price
- [ ] Completing checkout redirects back to `/settings?checkout=success`; **after a reload**, `isPro` is `true` (confirms the JWT re-sync works), Billing section now shows "Pro" + "Manage subscription"
- [ ] Verify via `stripe listen` logs (or Neon SQL) that `checkout.session.completed` correctly set `stripeCustomerId`/`stripeSubscriptionId`/`isPro=true` on the right user
- [ ] Post-upgrade: item/collection limits no longer enforced; File/Image types selectable and upload succeeds
- [ ] "Manage subscription" opens the Stripe Customer Portal for the correct customer
- [ ] Cancel the subscription in the Portal → trigger `stripe trigger customer.subscription.deleted` (or wait for the real event) → confirm webhook flips `isPro=false` and reload reflects it
- [ ] Webhook signature check: POST to `/api/webhooks/stripe` with a bad/missing `stripe-signature` header → 400, no DB writes
- [ ] Re-send an already-processed webhook event via the Stripe Dashboard's "Resend" — confirm idempotent behavior (no duplicate errors; setting the same status twice is safe since it's an unconditional `update`)
- [ ] Existing demo user (`demo@devstash.io`, already has 18 seeded items across 5 collections, comfortably under both limits) unaffected by gating changes

---

## 8. Implementation Order

1. `npm install stripe`; add `src/lib/stripe.ts`, `src/lib/constants/plan-limits.ts`, `.env.example` update; fill in real test-mode keys locally (§6 steps 1–3).
2. `src/lib/db/billing.ts` + tests.
3. `src/auth.ts` JWT/session sync + `src/types/next-auth.d.ts` — do this early since every subsequent gating check depends on `session.user.isPro` existing. Verify in-browser that a manual `isPro=true` flip in Neon SQL is reflected in the session after reload, **before** wiring any Stripe UI — isolates the JWT-sync fix from checkout complexity.
4. `src/actions/billing.ts` (`createCheckoutSession`, `createBillingPortalSession`) + rate-limit config entry + tests.
5. `src/app/api/webhooks/stripe/route.ts`. Set up `stripe listen` locally (§6 step 4) and verify `checkout.session.completed` end-to-end before building any UI on top of it.
6. `src/components/settings/BillingSection.tsx` + wire into `src/app/settings/page.tsx` + `getUserProfile()` update. Full checkout → webhook → session-reflects-Pro loop now testable in-browser.
7. `src/lib/plan-limits.ts` + tests; wire into `createItem`/`createCollection` server actions; update their tests.
8. Gate `POST /api/upload` on `isPro`; update `CreateItemDialog`'s type selector for the disabled/Pro-badge treatment on File/Image.
9. Full manual regression pass per §7's checklist; `npm run lint && npm test && npm run build`.
10. Deploy webhook endpoint in production Stripe Dashboard pointing at the deployed domain (§6 step 4, production variant) before flipping DNS/going live.

---

## 9. Future Considerations (explicitly out of scope for this plan)

- **AI features / export gating**: not yet built, so nothing to gate today — when built, follow the same `!session.user.isPro` check pattern established in §5.5/§5.7.
- **Custom item types**: same — gate at creation time once that feature exists.
- **Proration / plan switching UI**: the Customer Portal handles cancel/payment-method-update out of the box; a custom "switch monthly ↔ yearly" in-app UI would need `stripe.subscriptions.update()` with `proration_behavior` — not needed for Phase 1 since the Portal can be configured to allow this instead.
- **Grace period / past_due handling**: `customer.subscription.updated` as implemented above treats anything other than `active`/`trialing` as not-Pro immediately. A real product likely wants a `past_due` grace period before revoking access — revisit once real billing failures are observed.
- **`stripeCurrentPeriodEnd`/`stripePriceId` columns**: useful for showing "renews on <date>" in the Billing UI; add via a follow-up migration when that UI polish is prioritized.
