# DevDrop

A developer knowledge hub for snippets, commands, prompts, notes, files, images, links and custom types.

## Context Files

Read the following to get the full context of the project:

- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md

## Commands

```bash
npm run dev      # start dev server at localhost:3000
npm run build    # production build
npm run lint     # run ESLint
```

## Neon MCP Usage

When using the Neon MCP (`mcp__neon__*` tools) for this project:

- **Project:** `devdrop` (project ID `summer-brook-14208389`)
- **Always target the `development` branch** (branch ID `br-lively-bar-a67z766k`) — pass this `branchId` explicitly on every `run_sql` / query call.
- **Never** query, modify, or run SQL against the `production` branch (`br-spring-dew-a6ceivvq`) unless the user explicitly says "production" or "prod" by name.
- If the `development` branch shows as archived/suspended, note that in your response — the first query will auto-wake it.

## Stack

- **Next.js 16.2.2** with App Router — post-training-data version with breaking changes; consult `node_modules/next/dist/docs/` before writing any Next.js-specific code
- **React 19.2.4**
- **TypeScript**
- **Tailwind CSS v4** — configured via `@import "tailwindcss"` in `globals.css` and `postcss.config.mjs`; v4 uses a CSS-first config (no `tailwind.config.js`)
- **Geist** fonts (Sans + Mono) loaded via `next/font/google` in `layout.tsx`
