import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image,
  Link,
  type LucideIcon,
} from "lucide-react";

export const ITEM_TYPE_ICONS: Record<string, LucideIcon> = {
  snippet: Code,
  prompt: Sparkles,
  command: Terminal,
  note: StickyNote,
  file: File,
  image: Image,
  link: Link,
};

export const ITEM_TYPE_LABELS: Record<string, string> = {
  snippet: "Snippets",
  prompt: "Prompts",
  command: "Commands",
  note: "Notes",
  file: "Files",
  image: "Images",
  link: "Links",
};

export const PRO_ONLY_TYPES = new Set(["file", "image"]);

/** Types whose Content field is free-form text (as opposed to a URL or file). */
export const TEXT_CONTENT_TYPES = new Set(["snippet", "prompt", "command", "note"]);
/** Types that show a Language field alongside their content. */
export const LANGUAGE_TYPES = new Set(["snippet", "command"]);
/** Types whose content is source code, rendered with CodeEditor. */
export const CODE_TYPES = new Set(["snippet", "command"]);
/** Types whose content is markdown, rendered with MarkdownEditor. */
export const MARKDOWN_TYPES = new Set(["note", "prompt"]);
/** Types backed by an uploaded file. */
export const FILE_TYPES = new Set(["file", "image"]);

const ITEM_TYPE_NAMES = Object.keys(ITEM_TYPE_ICONS);

export function getItemTypeNameFromSlug(slug: string): string | undefined {
  return ITEM_TYPE_NAMES.find((name) => `${name}s` === slug);
}
