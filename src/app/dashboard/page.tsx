import { DashboardShell } from "@/components/layout/DashboardShell";
import { DashboardMain } from "@/components/dashboard/DashboardMain";
import { getSystemItemTypes } from "@/lib/db/items";
import { getRecentCollections } from "@/lib/db/collections";
import { prisma } from "@/lib/prisma";

const SIDEBAR_RECENT_COLLECTIONS_COUNT = 5;

export default async function DashboardPage() {
  const demoUser = await prisma.user.findUnique({
    where: { email: "demo@devstash.io" },
  });

  const [itemTypes, recentCollections] = await Promise.all([
    getSystemItemTypes(),
    demoUser
      ? getRecentCollections(demoUser.id, SIDEBAR_RECENT_COLLECTIONS_COUNT)
      : Promise.resolve([]),
  ]);

  return (
    <DashboardShell itemTypes={itemTypes} recentCollections={recentCollections}>
      <DashboardMain />
    </DashboardShell>
  );
}
