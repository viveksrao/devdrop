import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { DashboardMain } from "@/components/dashboard/DashboardMain";
import { getSystemItemTypes, getPinnedItems, getRecentItems, getItemStats } from "@/lib/db/items";
import { getRecentCollections, getCollectionStats } from "@/lib/db/collections";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const SIDEBAR_RECENT_COLLECTIONS_COUNT = 5;
const MAIN_RECENT_COLLECTIONS_COUNT = 6;
const RECENT_ITEMS_COUNT = 10;

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user) redirect("/sign-in");

  const [
    itemTypes,
    sidebarRecentCollections,
    mainRecentCollections,
    pinnedItems,
    recentItems,
    itemStats,
    collectionStats,
  ] = await Promise.all([
    getSystemItemTypes(user.id),
    getRecentCollections(user.id, SIDEBAR_RECENT_COLLECTIONS_COUNT),
    getRecentCollections(user.id, MAIN_RECENT_COLLECTIONS_COUNT),
    getPinnedItems(user.id),
    getRecentItems(user.id, RECENT_ITEMS_COUNT),
    getItemStats(user.id),
    getCollectionStats(user.id),
  ]);

  return (
    <DashboardShell
      itemTypes={itemTypes}
      recentCollections={sidebarRecentCollections}
      user={{
        name: user.name,
        email: user.email,
        image: user.image,
        isPro: user.isPro,
      }}
    >
      <DashboardMain
        userName={user.name ?? user.email ?? "there"}
        recentCollections={mainRecentCollections}
        pinnedItems={pinnedItems}
        recentItems={recentItems}
        itemStats={itemStats}
        collectionStats={collectionStats}
      />
    </DashboardShell>
  );
}
