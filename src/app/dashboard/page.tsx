import { DashboardShell } from "@/components/layout/DashboardShell";
import { DashboardMain } from "@/components/dashboard/DashboardMain";
import {
  getSystemItemTypes,
  getPinnedItems,
  getRecentItems,
  getItemStats,
  type ItemWithType,
  type ItemStats,
} from "@/lib/db/items";
import {
  getRecentCollections,
  getCollectionStats,
  type CollectionWithStats,
  type CollectionStats,
} from "@/lib/db/collections";
import { prisma } from "@/lib/prisma";

const SIDEBAR_RECENT_COLLECTIONS_COUNT = 5;
const MAIN_RECENT_COLLECTIONS_COUNT = 6;
const RECENT_ITEMS_COUNT = 10;

const EMPTY_ITEM_STATS: ItemStats = { totalItems: 0, favoriteItems: 0 };
const EMPTY_COLLECTION_STATS: CollectionStats = { totalCollections: 0, favoriteCollections: 0 };

export default async function DashboardPage() {
  const demoUser = await prisma.user.findUnique({
    where: { email: "demo@devstash.io" },
  });

  let itemTypes: Awaited<ReturnType<typeof getSystemItemTypes>> = [];
  let sidebarRecentCollections: CollectionWithStats[] = [];
  let mainRecentCollections: CollectionWithStats[] = [];
  let pinnedItems: ItemWithType[] = [];
  let recentItems: ItemWithType[] = [];
  let itemStats: ItemStats = EMPTY_ITEM_STATS;
  let collectionStats: CollectionStats = EMPTY_COLLECTION_STATS;

  if (demoUser) {
    [
      itemTypes,
      sidebarRecentCollections,
      mainRecentCollections,
      pinnedItems,
      recentItems,
      itemStats,
      collectionStats,
    ] = await Promise.all([
      getSystemItemTypes(demoUser.id),
      getRecentCollections(demoUser.id, SIDEBAR_RECENT_COLLECTIONS_COUNT),
      getRecentCollections(demoUser.id, MAIN_RECENT_COLLECTIONS_COUNT),
      getPinnedItems(demoUser.id),
      getRecentItems(demoUser.id, RECENT_ITEMS_COUNT),
      getItemStats(demoUser.id),
      getCollectionStats(demoUser.id),
    ]);
  }

  return (
    <DashboardShell itemTypes={itemTypes} recentCollections={sidebarRecentCollections}>
      <DashboardMain
        recentCollections={mainRecentCollections}
        pinnedItems={pinnedItems}
        recentItems={recentItems}
        itemStats={itemStats}
        collectionStats={collectionStats}
      />
    </DashboardShell>
  );
}
