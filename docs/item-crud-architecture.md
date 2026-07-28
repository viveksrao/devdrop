# Item CRUD Architecture

**Status: design proposal.** None of the file structure below exists yet —
there is no `/items/[type]` route, no `src/actions/` directory, and item
create/update/delete has no implementation anywhere in the codebase today
(confirmed via search: only auth-related mutations exist, all as API routes
under `src/app/api/auth/*`). This document designs a unified CRUD system for
all 7 item types per [docs/item-types.md](item-types.md), following the
conventions in `context/coding-standards.md`.

## Why Server Actions, Not API Routes

Per `context/coding-standards.md`, API routes are reserved for webhooks, file
uploads with progress tracking, long-running operations, or third-party
integrations. Plain item create/update/delete is a simple mutation from a
form/dialog in the dashboard — the standard case for Server Actions. The one
exception is file/image upload (see [Open Question](#open-question-file-upload)).

## File Structure

```
src/
├── actions/
│   └── items.ts              # createItem, updateItem, deleteItem (all types)
├── lib/
│   └── db/
│       └── items.ts          # existing: getPinnedItems, getRecentItems, getItemStats,
│                              #           getSystemItemTypes — extend with getItemsByType,
│                              #           getItemById
├── app/
│   └── items/
│       └── [type]/
│           └── page.tsx      # one dynamic route for all 7 types
├── components/
│   └── items/
│       ├── ItemList.tsx          # fetches nothing; renders items passed as props
│       ├── ItemForm.tsx          # create/edit dialog, switches fields by contentType
│       ├── ItemCard.tsx          # existing (src/components/dashboard/ItemCard.tsx) — reused
│       ├── fields/
│       │   ├── TextContentField.tsx   # snippet/prompt/command/note: textarea + language picker
│       │   ├── FileUploadField.tsx    # file/image: dropzone + progress
│       │   └── UrlField.tsx           # link: url + description
│       └── DeleteItemDialog.tsx  # shared confirm dialog, type-agnostic
└── types/
    └── items.ts               # ItemFormInput, ItemActionResult, etc.
```

This mirrors the existing pattern already in place for collections/user data:
`lib/db/*.ts` for reads (called directly from server components, per
`getRecentCollections`/`getPinnedItems` today), and a new `actions/*.ts` for
writes — matching `context/coding-standards.md`'s prescribed
`src/actions/[feature].ts` location, which nothing currently populates.

## One Mutation File: `src/actions/items.ts`

All three mutations for all 7 types live in a single file, dispatching on
`contentType` only where the DB payload differs — not on the display type
name:

```ts
"use server";

export async function createItem(input: CreateItemInput): Promise<ItemActionResult>
export async function updateItem(id: string, input: UpdateItemInput): Promise<ItemActionResult>
export async function deleteItem(id: string): Promise<ItemActionResult>
```

- Each action: authenticates via `auth()`, validates input with a Zod schema
  keyed by `contentType` (TEXT requires `content`; FILE requires
  `fileUrl`/`fileName`/`fileSize`; URL requires `url`), verifies the item
  belongs to `session.user.id` before update/delete, writes via
  `prisma.item.*`, and returns `{ success, data, error }` per
  `context/coding-standards.md`'s error-handling convention.
- There is **no per-type branching on `itemType.name`** ("snippet" vs
  "command") anywhere in this file — only on the 3-value `contentType` enum,
  since that's what determines which columns are written. The distinction
  between, say, a snippet and a command is just which `itemTypeId` gets
  passed in; the action code doesn't need to know or care.
- Tag creation/association (`connectOrCreate` on `Tag.name`) and collection
  membership (`ItemCollection` upsert) are handled inside `createItem`/
  `updateItem` as part of the same transaction, since collection assignment
  is a normal part of the item form.

## How `/items/[type]` Routing Works

`src/app/items/[type]/page.tsx` is the single route for all 7 type pages
(`/items/snippets`, `/items/prompts`, ... `/items/links` — matching the
plural hrefs already emitted by `DashboardSidebar.tsx:86`).

1. Server component reads `params.type` (e.g. `"snippets"`), strips the
   trailing `s` to get the `ItemType.name` (`"snippet"`), and 404s
   (`notFound()`) if it doesn't match one of the 7 known system type names —
   this guards against arbitrary route params without needing a DB round
   trip first.
2. Calls `auth()` for the session, then `getItemsByType(userId, typeName)`
   from `lib/db/items.ts` directly (server component fetches with Prisma,
   per coding standards — no API route involved for reads).
3. Renders a shared `ItemList` component, passing the fetched items and the
   resolved `ItemType` (icon/color/name) down as props. `ItemList` and
   `ItemCard` don't know which of the 7 types they're showing — they just
   render whatever `contentType`-shaped data they're given.
4. The "New Item" action on this page pre-fills `ItemForm` with the current
   `itemTypeId`, so creating from `/items/commands` defaults to a command
   without the user re-selecting a type.

This gives 7 pages from 1 route file/1 layout, differing only in the
`ItemType` row fetched and the items filtered by `itemTypeId`.

## Where Type-Specific Logic Lives

Per the research brief's constraint, **type-specific logic lives in
components, not actions.** The actions file only branches on `contentType`
(3 values, structural — which DB columns to fill). Everything about how a
type *looks or behaves* lives in components:

| Concern                                             | Lives in                          |
| ---------------------------------------------------- | ---------------------------------- |
| Which form fields render (code editor vs dropzone vs url input) | `ItemForm.tsx`, switching on `contentType` to pick a `fields/*` component |
| Syntax highlighting + language picker for snippet/command | `TextContentField.tsx` (only mounted when `contentType === "TEXT"` and the type has a `language`, i.e. snippet/command, not prompt/note) |
| Thumbnail preview vs generic file icon (image vs file) | `ItemCard.tsx` / a future `FilePreview.tsx`, switching on `itemType.name`, not `contentType` — this is the one place a distinction narrower than `contentType` matters, since image and file share `contentType: FILE` but display differently |
| External-link affordance, opening in new tab | `ItemCard.tsx` for link items |
| Pro-gating UI (disabled state, upsell prompt) | `FileUploadField.tsx`, checking `PRO_ONLY_TYPES` from `src/lib/constants/item-types.ts` |
| Icon/color per type | Already centralized: `ITEM_TYPE_ICONS`/`ITEM_TYPE_LABELS` (`src/lib/constants/item-types.ts`) + `ItemType.color` from the DB row — no component hardcodes these |

## Component Responsibilities

- **`ItemList`** — pure presentational, receives `ItemWithType[]` as props
  (same shape `lib/db/items.ts` already returns), renders a grid of
  `ItemCard`s. No data fetching, no type-awareness beyond what's in the
  props.
- **`ItemCard`** (existing, `src/components/dashboard/ItemCard.tsx`) —
  reused as-is for the grid view; gains contentType-aware rendering
  (thumbnail for image, download affordance for file, external-link icon for
  link, syntax-highlighted snippet preview for snippet/command) as a
  follow-up, since today it renders identically for all types (see
  [docs/item-types.md](item-types.md)).
- **`ItemForm`** — the only component that needs to know about all 7 types
  at once: given an `ItemType`, it decides which `fields/*` subcomponent to
  mount based on `contentType`, then calls `createItem`/`updateItem` on
  submit.
- **`fields/TextContentField`, `fields/FileUploadField`, `fields/UrlField`**
  — each owns exactly one `contentType`'s input UI and client-side
  validation; swappable without touching `ItemForm`'s submit logic.
- **`DeleteItemDialog`** — fully type-agnostic; takes an item id and title,
  calls `deleteItem`.

## Open Question: File Upload

File/image creation needs an actual upload step (to Cloudflare R2) before an
`Item` row can be created with a real `fileUrl`. Per coding standards, file
uploads with progress tracking are exactly the case that justifies an API
route. The likely split:

1. `POST /api/upload` (API route) — accepts the raw file, uploads to R2,
   returns `{ fileUrl, fileName, fileSize }`.
2. `createItem` (server action) — called afterward with those fields already
   resolved, same as any other TEXT/URL item.

This keeps the "one mutation file" property intact for the `Item` row itself
— the API route only ever produces file metadata, never touches the
`Item`/`ItemType`/`Tag`/`ItemCollection` tables.

## Sources

- [context/project-overview.md](../context/project-overview.md)
- [docs/item-types.md](item-types.md) (research brief referenced this as
  `docs/content-types.md`, which doesn't exist — `item-types.md` is the file
  produced by the prior `/research item-types-research.md` run)
- [prisma/schema.prisma](../prisma/schema.prisma)
- [src/lib/constants/item-types.ts](../src/lib/constants/item-types.ts)
  (research brief referenced `src/lib/constants.tsx`, which doesn't exist)
- `src/lib/db/items.ts`, `src/lib/db/collections.ts` (existing read patterns)
- `src/components/layout/DashboardSidebar.tsx` (existing `/items/[type]s`
  href convention)
- `src/app/api/auth/change-password/route.ts` (existing
  `{ success, data, error }` mutation pattern to follow inside actions)
