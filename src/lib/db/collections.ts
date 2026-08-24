import { prisma } from "@/lib/prisma";

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

export async function getRecentCollections(
  userId: string,
  limit: number
): Promise<CollectionWithStats[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
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
    },
  });

  return collections.map((collection) => {
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
  });
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
