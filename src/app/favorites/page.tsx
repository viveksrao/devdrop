import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { FavoriteItemRow } from "@/components/dashboard/FavoriteItemRow";
import { FavoriteCollectionRow } from "@/components/dashboard/FavoriteCollectionRow";
import { getFavoriteItems, getSystemItemTypes } from "@/lib/db/items";
import { getFavoriteCollections, getRecentCollections, getAllCollections } from "@/lib/db/collections";
import { prisma } from "@/lib/prisma";

const SIDEBAR_RECENT_COLLECTIONS_COUNT = 5;

export default async function FavoritesPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/sign-in");

  const [favoriteItems, favoriteCollections, itemTypes, sidebarRecentCollections, allCollections] =
    await Promise.all([
      getFavoriteItems(user.id),
      getFavoriteCollections(user.id),
      getSystemItemTypes(user.id),
      getRecentCollections(user.id, SIDEBAR_RECENT_COLLECTIONS_COUNT),
      getAllCollections(user.id),
    ]);

  const hasFavorites = favoriteItems.length > 0 || favoriteCollections.length > 0;

  return (
    <DashboardShell
      itemTypes={itemTypes}
      recentCollections={sidebarRecentCollections}
      allCollections={allCollections}
      user={{
        name: user.name,
        email: user.email,
        image: user.image,
        isPro: user.isPro,
      }}
    >
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Favorites</h1>
          <p className="mt-1 text-muted-foreground">
            {favoriteItems.length + favoriteCollections.length} favorited
          </p>
        </div>

        {!hasFavorites ? (
          <p className="text-sm text-muted-foreground">
            No favorites yet. Star items and collections to see them here.
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            <section>
              <h2 className="px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Items ({favoriteItems.length})
              </h2>
              {favoriteItems.length === 0 ? (
                <p className="px-2 py-1.5 text-sm text-muted-foreground">No favorited items.</p>
              ) : (
                <div className="mt-1 flex flex-col divide-y divide-border">
                  {favoriteItems.map((item) => (
                    <FavoriteItemRow key={item.id} item={item} />
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Collections ({favoriteCollections.length})
              </h2>
              {favoriteCollections.length === 0 ? (
                <p className="px-2 py-1.5 text-sm text-muted-foreground">
                  No favorited collections.
                </p>
              ) : (
                <div className="mt-1 flex flex-col divide-y divide-border">
                  {favoriteCollections.map((collection) => (
                    <FavoriteCollectionRow key={collection.id} collection={collection} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
