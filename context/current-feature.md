# Current Feature

<!-- Feature name and short description -->

Prisma + Neon PostgreSQL Setup - Set up Prisma ORM with a Neon PostgreSQL database, including initial schema and NextAuth models (see @context/features/database-spec.md)

## Status

<!-- Not Started | In Progress | Completed  -->

Completed

## Goals

<!-- Goals and Requirements -->

- Use Neon PostgreSQL (serverless)
- Create initial schema based on data models in project-overview.md (this will evolve)
- Include NextAuth models (Account, Session, VerificationToken)
- Add appropriate indexes and cascade deletes

## Notes

<!-- Any extra notes -->

- Development branch database uses DATABASE_URL; production is a separate branch. Always create migrations (`prisma migrate dev`) and never push directly unless specified.
- Use Prisma 7, which has breaking changes - read the upgrade guide (https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7) before implementing.
- Reference the Prisma quickstart guide as well: https://www.prisma.io/docs/getting-started/prisma-orm/quickstart/prisma-postgres
- Full requirements in @context/features/database-spec.md

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