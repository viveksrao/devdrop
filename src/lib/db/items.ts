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

export async function getItemsByType(
  userId: string,
  typeName: string
): Promise<ItemWithType[]> {
  const items = await prisma.item.findMany({
    where: { userId, itemType: { name: typeName } },
    orderBy: { createdAt: "desc" },
    include: { itemType: true, tags: true },
  });

  return items.map(toItemWithType);
}

export interface ItemDetail {
  id: string;
  title: string;
  description: string | null;
  contentType: "TEXT" | "FILE" | "URL";
  content: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  url: string | null;
  language: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  itemType: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
  collections: {
    id: string;
    name: string;
  }[];
}

export async function getItemDetail(
  userId: string,
  itemId: string
): Promise<ItemDetail | null> {
  const item = await prisma.item.findFirst({
    where: { id: itemId, userId },
    include: {
      itemType: true,
      tags: true,
      collections: { include: { collection: true } },
    },
  });

  if (!item) return null;

  return {
    id: item.id,
    title: item.title,
    description: item.description,
    contentType: item.contentType,
    content: item.content,
    fileUrl: item.fileUrl,
    fileName: item.fileName,
    fileSize: item.fileSize,
    url: item.url,
    language: item.language,
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    tags: item.tags.map((tag) => tag.name),
    itemType: item.itemType,
    collections: item.collections.map((ic) => ({
      id: ic.collection.id,
      name: ic.collection.name,
    })),
  };
}

export interface UpdateItemInput {
  title: string;
  description: string | null;
  content: string | null;
  url: string | null;
  language: string | null;
  tags: string[];
}

export async function updateItem(
  userId: string,
  itemId: string,
  data: UpdateItemInput
): Promise<ItemDetail | null> {
  const existing = await prisma.item.findFirst({ where: { id: itemId, userId } });
  if (!existing) return null;

  const item = await prisma.item.update({
    where: { id: itemId },
    data: {
      title: data.title,
      description: data.description,
      content: data.content,
      url: data.url,
      language: data.language,
      tags: {
        set: [],
        connectOrCreate: data.tags.map((name) => ({
          where: { name },
          create: { name },
        })),
      },
    },
    include: {
      itemType: true,
      tags: true,
      collections: { include: { collection: true } },
    },
  });

  return {
    id: item.id,
    title: item.title,
    description: item.description,
    contentType: item.contentType,
    content: item.content,
    fileUrl: item.fileUrl,
    fileName: item.fileName,
    fileSize: item.fileSize,
    url: item.url,
    language: item.language,
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    tags: item.tags.map((tag) => tag.name),
    itemType: item.itemType,
    collections: item.collections.map((ic) => ({
      id: ic.collection.id,
      name: ic.collection.name,
    })),
  };
}

export async function deleteItem(userId: string, itemId: string): Promise<boolean> {
  const existing = await prisma.item.findFirst({ where: { id: itemId, userId } });
  if (!existing) return false;

  await prisma.item.delete({ where: { id: itemId } });

  return true;
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
  itemCount: number;
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

export async function getSystemItemTypes(userId: string): Promise<SystemItemType[]> {
  const [types, counts] = await Promise.all([
    prisma.itemType.findMany({
      where: { isSystem: true },
      select: { id: true, name: true, icon: true, color: true },
    }),
    prisma.item.groupBy({
      by: ["itemTypeId"],
      where: { userId },
      _count: { _all: true },
    }),
  ]);

  const countByTypeId = new Map(counts.map((c) => [c.itemTypeId, c._count._all]));

  return types
    .map((type) => ({ ...type, itemCount: countByTypeId.get(type.id) ?? 0 }))
    .sort(
      (a, b) => SYSTEM_ITEM_TYPE_ORDER.indexOf(a.name) - SYSTEM_ITEM_TYPE_ORDER.indexOf(b.name)
    );
}
