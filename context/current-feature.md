# Current Feature

<!-- Feature name and short description -->

Add Count of each Type to Sidebar - Show total item count per type in the sidebar, moving the PRO badge next to the type label (see @context/features/add-count-of-each-types-sidebar.md)

## Status

<!-- Not Started | In Progress | Completed  -->

Not Started

## Goals

<!-- Goals and Requirements -->

- Add total count of items for each system type (Snippets, Prompts, Commands, Notes, Files, Images, Links) in the sidebar
- Position the count where the PRO badge is currently placed (trailing side of the row)
- Move the PRO badge to sit next to the type label text ("Files" & "Images"), with spacing between badge and text

## Notes

<!-- Any extra notes -->

- Full requirements in @context/features/add-count-of-each-types-sidebar.md
- Current implementation: src/components/layout/DashboardSidebar.tsx — SidebarLink renders `badge` (currently "PRO") in the trailing slot after the label; needs restructuring so PRO badge moves next to label and a new count is added in the trailing slot
- Item types + counts likely need extending in src/lib/db/items.ts (getSystemItemTypes or a new function) to include per-type item counts

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