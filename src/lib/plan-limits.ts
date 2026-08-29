import { prisma } from "@/lib/prisma";
import { FREE_TIER_LIMITS } from "@/lib/constants/plan-limits";

export async function canCreateItem(userId: string, isPro: boolean): Promise<boolean> {
  if (isPro) return true;
  const count = await prisma.item.count({ where: { userId } });
  return count < FREE_TIER_LIMITS.maxItems;
}

export async function canCreateCollection(userId: string, isPro: boolean): Promise<boolean> {
  if (isPro) return true;
  const count = await prisma.collection.count({ where: { userId } });
  return count < FREE_TIER_LIMITS.maxCollections;
}
