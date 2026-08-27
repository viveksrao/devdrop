import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { DashboardMain } from "@/components/dashboard/DashboardMain";
import { getSystemItemTypes, getPinnedItems, getRecentItems, getItemStats } from "@/lib/db/items";
import { getRecentCollections, getCollectionStats, getAllCollections } from "@/lib/db/collections";
import { DASHBOARD_COLLECTIONS_LIMIT, DASHBOARD_RECENT_ITEMS_LIMIT } from "@/lib/constants/pagination";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const SIDEBAR_RECENT_COLLECTIONS_COUNT = 5;

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
    allCollections,
    pinnedItems,
    recentItems,
    itemStats,
    collectionStats,
  ] = await Promise.all([
    getSystemItemTypes(user.id),
    getRecentCollections(user.id, SIDEBAR_RECENT_COLLECTIONS_COUNT),
    getRecentCollections(user.id, DASHBOARD_COLLECTIONS_LIMIT),
    getAllCollections(user.id),
    getPinnedItems(user.id),
    getRecentItems(user.id, DASHBOARD_RECENT_ITEMS_LIMIT),
    getItemStats(user.id),
    getCollectionStats(user.id),
  ]);

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
