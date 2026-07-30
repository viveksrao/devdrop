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

const ITEM_TYPE_NAMES = Object.keys(ITEM_TYPE_ICONS);

export function getItemTypeNameFromSlug(slug: string): string | undefined {
  return ITEM_TYPE_NAMES.find((name) => `${name}s` === slug);
}
