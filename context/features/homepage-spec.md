# Homepage

## Overview

Replace the placeholder `src/app/page.tsx` (currently just `<h1>DevDrop</h1>`) with the real marketing homepage, rebuilding the static mockup in `prototypes/homepage/` (`index.html`/`styles.css`/`script.js`) as Next.js/React components using Tailwind CSS v4 + shadcn/ui, matching the rest of the app's conventions instead of copying the mockup's plain CSS file.

## Scope

- `/` route only (`src/app/page.tsx`)
- Port all sections from the mockup: Navbar, Hero (with chaos→order animated visual), Features, AI Section, Pricing, CTA, Footer
- Reuse the mockup's color palette, layout, and copy as the visual/content reference — it does not have to be pixel-exact, but should be recognizably the same design
- Out of scope: actual Stripe checkout, real auth-aware CTAs beyond linking to existing routes, blog/changelog pages (footer links to these can be `#` or `/` placeholders since they don't exist yet)

## Component Breakdown

Follow the "server components by default, client only when needed" rule from `context/coding-standards.md`. New components live in `src/components/marketing/`.

| Component | Type | Why |
|---|---|---|
| `page.tsx` | Server | Composes all sections in order; no interactivity itself |
| `MarketingNavbar` | Client | Scroll listener to toggle opaque background on scroll |
| `HeroSection` | Server | Static headline/subhead/CTAs; renders `ChaosOrderVisual` |
| `ChaosOrderVisual` | Client | Owns the floating-icon animation (rAF loop, mouse-repel, bounce) and the static dashboard-preview mock |
| `FeaturesSection` | Server | Static 6-card grid, one per item type, reusing `ITEM_TYPE_COLORS`/`ITEM_TYPE_ICONS` from `src/lib/constants/item-types.ts` where the icon/color matches an existing item type |
| `AISection` | Server | Static two-column layout; the code editor mock is static markup (no live Monaco needed) |
| `PricingSection` | Client | Owns monthly/yearly toggle state |
| `CTASection` | Server | Static |
| `MarketingFooter` | Server | Static; copyright year via `new Date().getFullYear()` computed at render (server component, no client JS needed) |
| `ScrollFadeIn` | Client | Small wrapper using `IntersectionObserver` to add a fade/slide-in class to its children; used by section headings/cards in place of the mockup's `.fade-in` + scroll listener script |

Keep each component focused (one job per component, per `context/coding-standards.md`), and extract the `ScrollFadeIn` intersection-observer logic into a single reusable client component/hook rather than duplicating it per section — avoid re-implementing the same fade-in logic six times (DRY).

## Styling

- Tailwind CSS v4 utility classes throughout — no new CSS file, no `tailwind.config.js`
- Any repeated custom values (gradient text, the type accent colors, glow shadows) that aren't already Tailwind defaults go in `@theme` in `src/app/globals.css`, following the existing `--color-*` custom properties pattern already there for item types
- Use shadcn/ui primitives where they fit: `Button` (primary/ghost variants via `buttonVariants`, matching the precedent in `DashboardTopBar`'s favorites-star link and `DashboardSidebar`'s `SidebarLink`) for all CTAs, `Switch` (already installed for Editor Preferences) for the pricing monthly/yearly toggle instead of the mockup's custom `<button role="switch">`
- Dark mode first, matching the rest of the app (root `<html>` already has `className="dark"` — no extra work needed here, just don't hardcode colors that fight the app's theme tokens)
- Reuse `ITEM_TYPE_COLORS`/`ITEM_TYPE_ICONS` (`src/lib/constants/item-types.ts`) for the Features section's per-card accent instead of re-declaring the same 6 hex codes — keeps the marketing page's colors in sync with the actual item-type colors used throughout the app

## Animations

- **Chaos icons**: reimplement the mockup's `script.js` rAF loop (drift, wall-bounce, mouse-repel) inside `ChaosOrderVisual` using a `useEffect` + `useRef` per icon (or a single canvas-free div-based approach matching the mockup); clean up the rAF loop and any event listeners on unmount
- **Arrow pulse**: pure CSS animation (Tailwind `animate-*` utility or an `@theme` keyframe), no JS needed
- **Scroll fade-in**: `ScrollFadeIn` client component (see above) instead of the mockup's manual `IntersectionObserver` + class toggling in `script.js`
- **Navbar opacity on scroll**: `MarketingNavbar` client component listens to `window.scroll` (or `IntersectionObserver` on a 0-height sentinel) and toggles background opacity classes

## Links & Buttons — must resolve correctly

Replace every mockup `href="#"` placeholder with a real route from the existing app:

| Element | Target |
|---|---|
| Navbar logo | `/` |
| Navbar "Features" / "Pricing" | `#features` / `#pricing` (in-page anchors, unchanged) |
| Navbar "Sign In" | `/sign-in` |
| Navbar "Get Started" | `/register` |
| Hero "Get Started Free" | `/register` |
| Hero "See Features" | `#features` (in-page anchor, unchanged) |
| Pricing card "Free" → "Get Started" | `/register` |
| Pricing card "Pro" → "Start Free Trial" | `/register` (no Stripe checkout wired yet — out of scope, see above) |
| CTA section "Get Started Free" | `/register` |
| Footer logo | `/` |
| Footer "Features" / "Pricing" | `#features` / `#pricing` |
| Footer "Changelog" / "About" / "Blog" / "Contact" / "Privacy" / "Terms" | No corresponding pages exist yet — link to `/` and leave a one-line note in code that these are placeholders, rather than a dead `#` |

All internal links use Next.js `Link` (from `next/link`), not `<a>`, so they don't full-page-reload. In-page hash anchors (`#features`, `#pricing`) can stay plain `<a href="#...">` since `Link` offers no benefit for same-page anchors.

If a signed-in user hits `/`, no redirect logic is required for this pass — the homepage stays public and reachable regardless of session state (out of scope: auth-aware homepage redirect to `/dashboard`).

## Data / Server Actions

None. This is a fully static marketing page — no Prisma queries, no server actions, no new API routes. No unit tests apply (per `context/coding-standards.md`, only server actions and lib utilities are tested — this feature adds neither).

## Verification

- `npm run lint` and `npm run build` pass
- In-browser (desktop ~1440px and mobile ~390px) verify: chaos icons animate and repel from the cursor, navbar opacity changes on scroll, section fade-ins trigger correctly, pricing toggle switches $8/mo ↔ $72/yr, every button/link above navigates to the correct route, and the layout matches the mockup's responsive stacking (chaos/arrow/dashboard vertical on mobile, feature/pricing grids collapse to one column)
