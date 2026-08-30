import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ItemCard } from "@/components/dashboard/ItemCard";
import { ImageCard } from "@/components/dashboard/ImageCard";
import { FileListItem } from "@/components/dashboard/FileListItem";
import { Pagination } from "@/components/dashboard/Pagination";
import { UpgradePrompt } from "@/components/dashboard/UpgradePrompt";
import { getItemTypeNameFromSlug, ITEM_TYPE_LABELS, PRO_ONLY_TYPES } from "@/lib/constants/item-types";
import { ITEMS_PER_PAGE } from "@/lib/constants/pagination";
import { getItemsByType, getSystemItemTypes } from "@/lib/db/items";
import { getRecentCollections, getAllCollections } from "@/lib/db/collections";
import { prisma } from "@/lib/prisma";

const SIDEBAR_RECENT_COLLECTIONS_COUNT = 5;

interface ItemsByTypePageProps {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function ItemsByTypePage({ params, searchParams }: ItemsByTypePageProps) {
  const { type } = await params;
  const typeName = getItemTypeNameFromSlug(type);
  if (!typeName) notFound();

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/sign-in");

  const label = ITEM_TYPE_LABELS[typeName] ?? typeName;
  const isGated = PRO_ONLY_TYPES.has(typeName) && !user.isPro;

  const [itemsResult, itemTypes, recentCollections, allCollections] = await Promise.all([
    isGated
      ? Promise.resolve({ items: [], totalCount: 0 })
      : getItemsByType(user.id, typeName, page, ITEMS_PER_PAGE),
    getSystemItemTypes(user.id),
    getRecentCollections(user.id, SIDEBAR_RECENT_COLLECTIONS_COUNT),
    getAllCollections(user.id),
  ]);
  const { items, totalCount } = itemsResult;

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <DashboardShell
      itemTypes={itemTypes}
      recentCollections={recentCollections}
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
          <h1 className="text-2xl font-semibold">{label}</h1>
          {!isGated && (
            <p className="mt-1 text-muted-foreground">
              {totalCount} {totalCount === 1 ? "item" : "items"}
            </p>
          )}
        </div>

        {isGated ? (
          <UpgradePrompt typeName={typeName} label={label} />
        ) : totalCount === 0 ? (
          <p className="text-sm text-muted-foreground">
            No {label.toLowerCase()} yet.
          </p>
        ) : typeName === "image" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <ImageCard key={item.id} item={item} />
            ))}
          </div>
        ) : typeName === "file" ? (
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <FileListItem key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {!isGated && (
          <Pagination currentPage={page} totalPages={totalPages} basePath={`/items/${type}`} />
        )}
      </div>
    </DashboardShell>
  );
}
