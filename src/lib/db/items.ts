import { prisma } from "@/lib/prisma";

export interface ItemWithType {
  id: string;
  title: string;
  description: string | null;
  contentType: "TEXT" | "FILE" | "URL";
  isFavorite: boolean;
  isPinned: boolean;
  tags: string[];
  itemType: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
}

function toItemWithType(item: {
  id: string;
  title: string;
  description: string | null;
  contentType: string;
  isFavorite: boolean;
  isPinned: boolean;
  tags: { name: string }[];
  itemType: { id: string; name: string; icon: string; color: string };
}): ItemWithType {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    contentType: item.contentType as ItemWithType["contentType"],
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    tags: item.tags.map((tag) => tag.name),
    itemType: item.itemType,
  };
}

export async function getPinnedItems(userId: string): Promise<ItemWithType[]> {
  const items = await prisma.item.findMany({
    where: { userId, isPinned: true },
    orderBy: { updatedAt: "desc" },
    include: { itemType: true, tags: true },
  });

  return items.map(toItemWithType);
}

export async function getRecentItems(userId: string, limit: number): Promise<ItemWithType[]> {
  const items = await prisma.item.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { itemType: true, tags: true },
  });

  return items.map(toItemWithType);
}

export interface ItemStats {
  totalItems: number;
  favoriteItems: number;
}

export async function getItemStats(userId: string): Promise<ItemStats> {
  const [totalItems, favoriteItems] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.item.count({ where: { userId, isFavorite: true } }),
  ]);

  return { totalItems, favoriteItems };
}

export interface SystemItemType {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const SYSTEM_ITEM_TYPE_ORDER = [
  "snippet",
  "prompt",
  "command",
  "note",
  "file",
  "image",
  "link",
];

export async function getSystemItemTypes(): Promise<SystemItemType[]> {
  const types = await prisma.itemType.findMany({
    where: { isSystem: true },
    select: { id: true, name: true, icon: true, color: true },
  });

  return types.sort(
    (a, b) => SYSTEM_ITEM_TYPE_ORDER.indexOf(a.name) - SYSTEM_ITEM_TYPE_ORDER.indexOf(b.name)
  );
}
