# Item Types

DevDrop's core unit is the **Item**. Every item has a type (`ItemType`) that
determines its icon, color, and (eventually) how it's displayed. There are 7
system types, seeded as immutable, user-agnostic `ItemType` rows
(`userId: null`, `isSystem: true`) in `prisma/seed.ts`.

## The 7 Types

| Type      | Icon (Lucide)                                | Color                    | Route             | Purpose                                     |
| --------- | --------------------------------------------- | ------------------------ | ------------------ | -------------------------------------------- |
| Snippet   | `Code`                                        | `#3b82f6` (blue)          | `/items/snippets`  | Reusable code snippets, patterns, boilerplate |
| Prompt    | `Sparkles`                                    | `#8b5cf6` (purple)        | `/items/prompts`   | AI prompts, system messages, prompt templates |
| Command   | `Terminal`                                    | `#f97316` (orange)        | `/items/commands`  | Shell/CLI commands worth remembering          |
| Note      | `StickyNote`                                  | `#fde047` (yellow)        | `/items/notes`     | Freeform text notes                           |
| File      | `File`                                        | `#6b7280` (gray)          | `/items/files`     | Uploaded files (Pro-only)                     |
| Image     | `Image`                                       | `#ec4899` (pink)          | `/items/images`    | Uploaded images (Pro-only)                    |
| Link      | `Link`                                        | `#10b981` (emerald)       | `/items/links`     | Saved URLs/bookmarks                          |

Icons and labels are defined in
[src/lib/constants/item-types.ts](../src/lib/constants/item-types.ts)
(`ITEM_TYPE_ICONS`, `ITEM_TYPE_LABELS`). Colors are **not** in that constants
file — they live on the `ItemType.color` DB column, originally set via
[prisma/seed.ts](../prisma/seed.ts).

Pro-only types are tracked via `PRO_ONLY_TYPES = new Set(["file", "image"])`
in the same constants file. Currently this is consumed in exactly one place —
`DashboardSidebar.tsx` — to render a "PRO" badge next to the File/Image nav
links. There is no upload UI, form, or server-side enforcement of this gate
yet (per the project overview's dev-time note: "During development, all users
can access all features").

## Key Fields Used Per Type

All types share the same `Item` model
([prisma/schema.prisma](../prisma/schema.prisma)); the type determines which
fields are populated, driven by the `ContentType` enum (`TEXT | FILE | URL`):

| Type    | `contentType` | Fields used                             |
| ------- | -------------- | ---------------------------------------- |
| Snippet | `TEXT`         | `content`, `language` (syntax highlighting) |
| Prompt  | `TEXT`         | `content`                                 |
| Command | `TEXT`         | `content`, `language` (e.g. `bash`)        |
| Note    | `TEXT`         | `content`                                  |
| File    | `FILE`         | `fileUrl`, `fileName`, `fileSize`          |
| Image   | `FILE`         | `fileUrl`, `fileName`, `fileSize`          |
| Link    | `URL`          | `url`, `description`                       |

Fields shared by every item regardless of type: `title`, `description`,
`isFavorite`, `isPinned`, `createdAt`/`updatedAt`, `userId`, `itemTypeId`,
`tags` (many-to-many), and `collections` (many-to-many via `ItemCollection`).

## Text vs File vs URL Classification

The 7 display types collapse into 3 underlying `contentType` values:

- **TEXT** — snippet, prompt, command, note. All store their payload in the
  `content` text column. Snippet and command additionally populate
  `language` for syntax highlighting (e.g. `typescript`, `bash`, `dockerfile`
  in the seed data).
- **FILE** — file, image. Both store metadata about an uploaded object
  (`fileUrl` pointing to Cloudflare R2, plus `fileName`/`fileSize`). These are
  the two Pro-gated types.
- **URL** — link. Stores a raw `url` plus an optional `description`.

## Display Differences

**Current implementation status:** display logic is not yet type-aware.
`ItemCard` (`src/components/dashboard/ItemCard.tsx`) renders identically for
all 7 types today — it only derives an icon (`ITEM_TYPE_ICONS[itemType.name]`)
and a border/accent color (`itemType.color`) from the item's type relation,
then shows `title`, `description`, `tags`, and a pin indicator. It does not
branch on `contentType`, and no per-type route (`/items/[type]`) exists yet,
though the sidebar already links to the planned URLs
(`/items/snippets`, `/items/files`, etc.).

**Planned/implied differences** (per the project overview and schema
comments, not yet built):

- **Snippet / Command** — rendered as syntax-highlighted code blocks using
  the `language` field (no highlighter library is installed yet — no
  `shiki`, `prismjs`, or `react-syntax-highlighter` in `package.json`).
- **Prompt / Note** — rendered as plain or markdown text (a markdown editor
  is planned per the project overview's feature list but not yet
  implemented).
- **File** — expected to show a generic file icon + filename/size +
  download link (Pro-only, no upload UI built yet).
- **Image** — expected to show a thumbnail preview (Pro-only, no upload UI
  built yet).
- **Link** — expected to render as an external link (opens in new tab), with
  the optional `description` shown as supporting text.

## Sources

- [context/project-overview.md](../context/project-overview.md)
- [prisma/schema.prisma](../prisma/schema.prisma)
- [src/lib/constants/item-types.ts](../src/lib/constants/item-types.ts)
- [prisma/seed.ts](../prisma/seed.ts)
- `src/components/dashboard/ItemCard.tsx`
- `src/components/layout/DashboardSidebar.tsx`
