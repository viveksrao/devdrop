# Current Feature

Fix Duplicate Data Fetching on Dashboard Load

`DashboardPage` (`src/app/dashboard/page.tsx`) and `DashboardMain` (`src/components/dashboard/DashboardMain.tsx`) each independently look up the demo user via `prisma.user.findUnique` and each call `getRecentCollections` (with different counts: 5 vs 6), causing duplicate queries on every dashboard render.

## Status

Completed

## Goals

- Fetch the demo user exactly once per dashboard render, in `DashboardPage`.
- Pass `userId` down as a prop into `DashboardMain` instead of `DashboardMain` re-querying `prisma.user.findUnique` itself.
- Resolve the `RECENT_COLLECTIONS_COUNT` (6, used for the main-area collections grid) vs `SIDEBAR_RECENT_COLLECTIONS_COUNT` (5, used for the sidebar) discrepancy — keep both call sites but avoid re-fetching the user.
- No change to visual output — sidebar and main content should render identically to today.

## Notes

- Scope is limited to this duplicate-fetch fix only — do not touch the mock-data/currentUser inconsistency or other findings from the recent codebase audit; those are separate, out of scope for this feature.
- `DashboardMain` is currently an async server component with no props; it will need a `userId: string` prop (or similar) instead.
- If `demoUser` is null, current behavior renders empty state (empty arrays/stats) rather than erroring — preserve this fallback behavior.

## History

<!-- Keep this updated. Earliest to latest -->

- 2026-04-05 (`ee234aa`) - Initial commit from Create Next App (Next.js project scaffolded)
- 2026-04-05 (`4a0a5cd`) - Bootstrap Your Files Manually
- 2026-04-24 (`097b736`) - Project Context & CLAUDE.md
- 2026-07-03 (`3fdb579`) - chore: Created Project Overview & Current Feature files for Context
- 2026-07-03 (`6645594`) - docs: Update current-feature history with Next.js initial setup
- 2026-07-04 (`10b6fd5`) - feat: Add mock data for dashboard UI
- 2026-07-04 - Dashboard UI Phase 1 completed: ShadCN UI setup, /dashboard route, dark mode default, top bar (search + New item), sidebar/main placeholders (see @context/features/dashboard-phase-1-spec.md)
- 2026-07-04 - Dashboard UI Phase 2 completed: collapsible sidebar, types/collections links, favorite & recent collections, user avatar area, mobile drawer, logo moved from top bar into sidebar header (see @context/features/dashboard-phase-2-spec.md)
- 2026-07-04 - Dashboard UI Phase 3 completed: main content area with stats cards (total items, collections, favorite items, favorite collections), recent collections grid, pinned items section, and 10 recent items grid (see @context/features/dashboard-phase-3-spec.md)
- 2026-07-05 - Prisma + Neon PostgreSQL setup completed: Prisma 7 (driver adapter model, `prisma-client` generator, `prisma.config.ts`) wired to a Neon Postgres dev branch, full schema (User, Item, ItemType, Collection, ItemCollection, Tag, plus NextAuth Account/Session/VerificationToken), initial migration applied, system item types seeded, `src/lib/prisma.ts` singleton client added (see @context/features/database-spec.md)
- 2026-07-05 - Seed data completed: `prisma/seed.ts` rewritten to seed the demo user (demo@devstash.io, bcryptjs-hashed password), all 7 system item types, and 5 collections (React Patterns, AI Workflows, DevOps, Terminal Commands, Design Resources) with 18 items total; script is idempotent (clears the demo user's prior items/collections before reseeding); added `bcryptjs` dependency (see @context/features/seed-spec.md)
- 2026-07-05 - Dashboard Collections completed: `src/lib/db/collections.ts` added with `getRecentCollections()` fetching real collections (with item counts, dominant content-type color, and per-type icons) via Prisma; `DashboardMain` and `CollectionCard` updated to render this real data in place of `mock-data.ts` collections; verified in-browser against the seeded demo user's 5 collections (see @context/features/dashboard-collections-spec.md)
- 2026-07-05 - Dashboard Items completed: `src/lib/db/items.ts` added with `getPinnedItems()`, `getRecentItems()`, and `getItemStats()`; `getCollectionStats()` added to `collections.ts`; `ItemCard` now derives its icon/border color from the item's type and takes a single `ItemWithType` prop; `StatsCards` now takes real stats as props instead of reading mock data; `DashboardMain` fetches pinned items, recent items, and stats via Prisma for the demo user; verified in-browser that the Pinned Items section hides when empty and appears correctly when an item is pinned (see @context/features/dashboard-items-spec.md)
- 2026-07-05 - Stats & Sidebar completed: `getSystemItemTypes()` added to `src/lib/db/items.ts`; `DashboardPage` fetches item types and recent collections for the demo user and passes them through `DashboardShell` into `DashboardSidebar`, replacing the sidebar's `mock-data.ts` usage; sidebar collections now show a colored circle for the most-used item type (favorites keep the star) and a "View all collections" link to `/collections` was added; main-area stats were already wired to the database from the Dashboard Items feature; verified in-browser (see @context/features/stats-sidebar-spec.md)
- 2026-07-14 - Add Count of each Type to Sidebar completed: `getSystemItemTypes()` now takes `userId` and joins a `prisma.item.groupBy` count per type, exposing `itemCount` on `SystemItemType`; `DashboardSidebar`'s `SidebarLink` moved the PRO badge to sit inline next to the type label (with `gap-2` spacing) and now renders the per-type item count in the trailing slot where PRO used to be; verified in-browser that counts render correctly and Files/Images show label → PRO badge → count (see @context/features/add-count-of-each-types-sidebar.md)
- 2026-07-19 - Fix Duplicate Data Fetching on Dashboard Load completed: `DashboardPage` (`src/app/dashboard/page.tsx`) is now the single place that looks up the demo user and fetches item types, sidebar/main recent collections, pinned items, recent items, and stats, passing them down as props; `DashboardMain` converted from an async server component (which duplicated the `prisma.user.findUnique` lookup and its own `getRecentCollections` call) into a pure presentational component receiving all data via props; verified `npm run build` and `npm run lint` pass and the dashboard renders identically in-browser