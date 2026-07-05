import { currentUser } from "@/lib/mock-data";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { CollectionCard } from "@/components/dashboard/CollectionCard";
import { ItemCard } from "@/components/dashboard/ItemCard";
import {
  getRecentCollections,
  getCollectionStats,
  type CollectionWithStats,
  type CollectionStats,
} from "@/lib/db/collections";
import {
  getPinnedItems,
  getRecentItems,
  getItemStats,
  type ItemWithType,
  type ItemStats,
} from "@/lib/db/items";
import { prisma } from "@/lib/prisma";

const RECENT_COLLECTIONS_COUNT = 6;
const RECENT_ITEMS_COUNT = 10;

const EMPTY_ITEM_STATS: ItemStats = { totalItems: 0, favoriteItems: 0 };
const EMPTY_COLLECTION_STATS: CollectionStats = { totalCollections: 0, favoriteCollections: 0 };

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export async function DashboardMain() {
  const demoUser = await prisma.user.findUnique({
    where: { email: "demo@devstash.io" },
  });

  let recentCollections: CollectionWithStats[] = [];
  let pinnedItems: ItemWithType[] = [];
  let recentItems: ItemWithType[] = [];
  let itemStats: ItemStats = EMPTY_ITEM_STATS;
  let collectionStats: CollectionStats = EMPTY_COLLECTION_STATS;

  if (demoUser) {
    [recentCollections, pinnedItems, recentItems, itemStats, collectionStats] =
      await Promise.all([
        getRecentCollections(demoUser.id, RECENT_COLLECTIONS_COUNT),
        getPinnedItems(demoUser.id),
        getRecentItems(demoUser.id, RECENT_ITEMS_COUNT),
        getItemStats(demoUser.id),
        getCollectionStats(demoUser.id),
      ]);
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">
          {getGreeting()}, {currentUser.name}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Your developer knowledge, all in one place.
        </p>
      </div>

      <StatsCards itemStats={itemStats} collectionStats={collectionStats} />

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Collections</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recentCollections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      </section>

      {pinnedItems.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Pinned Items</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pinnedItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Items</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recentItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
