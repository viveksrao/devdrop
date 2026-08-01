import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ItemCard } from "@/components/dashboard/ItemCard";
import { getItemTypeNameFromSlug, ITEM_TYPE_LABELS } from "@/lib/constants/item-types";
import { getItemsByType, getSystemItemTypes } from "@/lib/db/items";
import { getRecentCollections } from "@/lib/db/collections";
import { prisma } from "@/lib/prisma";

const SIDEBAR_RECENT_COLLECTIONS_COUNT = 5;

interface ItemsByTypePageProps {
  params: Promise<{ type: string }>;
}

export default async function ItemsByTypePage({ params }: ItemsByTypePageProps) {
  const { type } = await params;
  const typeName = getItemTypeNameFromSlug(type);
  if (!typeName) notFound();

  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/sign-in");

  const [items, itemTypes, recentCollections] = await Promise.all([
    getItemsByType(user.id, typeName),
    getSystemItemTypes(user.id),
    getRecentCollections(user.id, SIDEBAR_RECENT_COLLECTIONS_COUNT),
  ]);

  const label = ITEM_TYPE_LABELS[typeName] ?? typeName;

  return (
    <DashboardShell
      itemTypes={itemTypes}
      recentCollections={recentCollections}
      user={{
        name: user.name,
        email: user.email,
        image: user.image,
        isPro: user.isPro,
      }}
    >
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">{label}</h1>
          <p className="mt-1 text-muted-foreground">
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No {label.toLowerCase()} yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
