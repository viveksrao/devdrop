# Current Feature

<!-- Feature name and short description -->

Seed Data - Create a seed script (`prisma/seed.ts`) to populate the database with sample data for development and demos (see @context/features/seed-spec.md)

## Status

<!-- Not Started | In Progress | Completed  -->

Completed

## Goals

<!-- Goals and Requirements -->

- Seed a demo user (demo@devstash.io, password hashed with bcryptjs)
- Seed the 7 system item types (snippet, prompt, command, note, file, image, link)
- Seed 5 collections with items: React Patterns, AI Workflows, DevOps, Terminal Commands, Design Resources
- Use real URLs for link-type items

## Notes

<!-- Any extra notes -->

- Full requirements in @context/features/seed-spec.md

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