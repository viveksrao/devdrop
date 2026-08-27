import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ItemCard } from "@/components/dashboard/ItemCard";
import { ImageCard } from "@/components/dashboard/ImageCard";
import { FileListItem } from "@/components/dashboard/FileListItem";
import { CollectionDetailHeader } from "@/components/dashboard/CollectionDetailHeader";
import { Pagination } from "@/components/dashboard/Pagination";
import { COLLECTIONS_PER_PAGE } from "@/lib/constants/pagination";
import { getSystemItemTypes } from "@/lib/db/items";
import {
  getCollectionDetail,
  getRecentCollections,
  getAllCollections,
} from "@/lib/db/collections";
import { prisma } from "@/lib/prisma";

const SIDEBAR_RECENT_COLLECTIONS_COUNT = 5;

interface CollectionDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function CollectionDetailPage({
  params,
  searchParams,
}: CollectionDetailPageProps) {
  const { id } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/sign-in");

  const [collection, itemTypes, sidebarRecentCollections, allCollections] = await Promise.all([
    getCollectionDetail(user.id, id, page, COLLECTIONS_PER_PAGE),
    getSystemItemTypes(user.id),
    getRecentCollections(user.id, SIDEBAR_RECENT_COLLECTIONS_COUNT),
    getAllCollections(user.id),
  ]);

  if (!collection) notFound();

  const totalPages = Math.ceil(collection.totalItemCount / COLLECTIONS_PER_PAGE);
  const fileItems = collection.items.filter((item) => item.itemType.name === "file");
  const otherItems = collection.items.filter((item) => item.itemType.name !== "file");

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
        <CollectionDetailHeader collection={collection} itemCount={collection.totalItemCount} />

        {collection.totalItemCount === 0 ? (
          <p className="text-sm text-muted-foreground">No items in this collection yet.</p>
        ) : (
          <div className="flex flex-col gap-6">
            {otherItems.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {otherItems.map((item) =>
                  item.itemType.name === "image" ? (
                    <ImageCard key={item.id} item={item} />
                  ) : (
                    <ItemCard key={item.id} item={item} />
                  )
                )}
              </div>
            )}
            {fileItems.length > 0 && (
              <div className="flex flex-col gap-2">
                {fileItems.map((item) => (
                  <FileListItem key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        )}

        <Pagination currentPage={page} totalPages={totalPages} basePath={`/collections/${id}`} />
      </div>
    </DashboardShell>
  );
}
