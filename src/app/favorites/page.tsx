import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { FavoriteItemsSection } from "@/components/dashboard/FavoriteItemsSection";
import { FavoriteCollectionsSection } from "@/components/dashboard/FavoriteCollectionsSection";
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
            <FavoriteItemsSection items={favoriteItems} />
            <FavoriteCollectionsSection collections={favoriteCollections} />
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
