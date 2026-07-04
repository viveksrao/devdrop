import { collections, items, itemTypes, currentUser } from "@/lib/mock-data";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { CollectionCard } from "@/components/dashboard/CollectionCard";
import { ItemCard } from "@/components/dashboard/ItemCard";

const RECENT_COLLECTIONS_COUNT = 6;
const RECENT_ITEMS_COUNT = 10;

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardMain() {
  const recentCollections = collections.slice(0, RECENT_COLLECTIONS_COUNT);
  const pinnedItems = items.filter((item) => item.isPinned);
  const recentItems = items.slice(0, RECENT_ITEMS_COUNT);

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

      <StatsCards />

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
            {pinnedItems.map((item) => {
              const itemType = itemTypes.find((type) => type.id === item.itemTypeId);
              if (!itemType) return null;
              return <ItemCard key={item.id} item={item} itemType={itemType} />;
            })}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Items</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recentItems.map((item) => {
            const itemType = itemTypes.find((type) => type.id === item.itemTypeId);
            if (!itemType) return null;
            return <ItemCard key={item.id} item={item} itemType={itemType} />;
          })}
        </div>
      </section>
    </div>
  );
}
