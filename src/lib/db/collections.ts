import { prisma } from "@/lib/prisma";
import { toItemWithType, type ItemWithType } from "@/lib/db/items";

export interface CollectionTypeSummary {
  name: string;
  icon: string;
  color: string;
}

export interface CollectionWithStats {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  itemCount: number;
  /** Content types present in the collection, ordered most-used first. */
  types: CollectionTypeSummary[];
  /** Color of the most-used content type; used for the card border. */
  dominantColor: string | null;
}

type CollectionForStats = {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  items: { item: { itemType: { name: string; icon: string; color: string } } }[];
};

function toCollectionWithStats(collection: CollectionForStats): CollectionWithStats {
  const typeCounts = new Map<string, { count: number; icon: string; color: string }>();

  for (const { item } of collection.items) {
    const { name, icon, color } = item.itemType;
    const existing = typeCounts.get(name);
    if (existing) {
      existing.count += 1;
    } else {
      typeCounts.set(name, { count: 1, icon, color });
    }
  }

  const sortedTypes = [...typeCounts.entries()].sort((a, b) => b[1].count - a[1].count);

  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    isFavorite: collection.isFavorite,
    itemCount: collection.items.length,
    types: sortedTypes.map(([name, { icon, color }]) => ({ name, icon, color })),
    dominantColor: sortedTypes[0]?.[1].color ?? null,
  };
}

const COLLECTION_STATS_SELECT = {
  id: true,
  name: true,
  description: true,
  isFavorite: true,
  items: {
    select: {
      item: {
        select: {
          itemType: {
            select: { name: true, icon: true, color: true },
          },
        },
      },
    },
  },
} as const;

export async function getRecentCollections(
  userId: string,
  limit: number
): Promise<CollectionWithStats[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: COLLECTION_STATS_SELECT,
  });

  return collections.map(toCollectionWithStats);
}

export async function getCollections(userId: string): Promise<CollectionWithStats[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: COLLECTION_STATS_SELECT,
  });

  return collections.map(toCollectionWithStats);
}

export interface CollectionOption {
  id: string;
  name: string;
}

export async function getAllCollections(userId: string): Promise<CollectionOption[]> {
  return prisma.collection.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export interface CollectionStats {
  totalCollections: number;
  favoriteCollections: number;
}

export async function getCollectionStats(userId: string): Promise<CollectionStats> {
  const [totalCollections, favoriteCollections] = await Promise.all([
    prisma.collection.count({ where: { userId } }),
    prisma.collection.count({ where: { userId, isFavorite: true } }),
  ]);

  return { totalCollections, favoriteCollections };
}

export interface CollectionDetail {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  items: ItemWithType[];
}

export async function getCollectionDetail(
  userId: string,
  collectionId: string
): Promise<CollectionDetail | null> {
  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    select: {
      id: true,
      name: true,
      description: true,
      isFavorite: true,
      items: {
        orderBy: { item: { createdAt: "desc" } },
        select: {
          item: {
            include: { itemType: true, tags: true },
          },
        },
      },
    },
  });

  if (!collection) return null;

  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    isFavorite: collection.isFavorite,
    items: collection.items.map(({ item }) => toItemWithType(item)),
  };
}

export interface CreateCollectionInput {
  name: string;
  description: string | null;
}

export async function createCollection(
  userId: string,
  data: CreateCollectionInput
): Promise<CollectionWithStats> {
  const collection = await prisma.collection.create({
    data: {
      name: data.name,
      description: data.description,
      userId,
    },
  });

  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    isFavorite: collection.isFavorite,
    itemCount: 0,
    types: [],
    dominantColor: null,
  };
}

export interface UpdateCollectionInput {
  name: string;
  description: string | null;
}

export async function updateCollection(
  userId: string,
  collectionId: string,
  data: UpdateCollectionInput
): Promise<CollectionWithStats | null> {
  const existing = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
  });
  if (!existing) return null;

  const collection = await prisma.collection.update({
    where: { id: collectionId },
    data: {
      name: data.name,
      description: data.description,
    },
    select: COLLECTION_STATS_SELECT,
  });

  return toCollectionWithStats(collection);
}

export async function deleteCollection(userId: string, collectionId: string): Promise<boolean> {
  const existing = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
  });
  if (!existing) return false;

  await prisma.collection.delete({ where: { id: collectionId } });

  return true;
}
