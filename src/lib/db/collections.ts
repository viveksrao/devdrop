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
    include: {
      items: {
        include: {
          item: {
            include: {
              itemType: true,
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
