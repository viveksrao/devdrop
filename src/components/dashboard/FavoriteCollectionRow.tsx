"use client";

import { useRouter } from "next/navigation";
import { Folder } from "lucide-react";
import type { CollectionWithStats } from "@/lib/db/collections";

interface FavoriteCollectionRowProps {
  collection: CollectionWithStats;
}

export function FavoriteCollectionRow({ collection }: FavoriteCollectionRowProps) {
  const router = useRouter();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/collections/${collection.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(`/collections/${collection.id}`);
        }
      }}
      className="flex cursor-pointer items-center gap-3 px-2 py-1.5 font-mono text-sm transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <Folder
        className="size-3.5 shrink-0"
        style={{ color: collection.dominantColor ?? undefined }}
      />
      <span className="min-w-0 flex-1 truncate">{collection.name}</span>
      <span className="shrink-0 text-xs uppercase text-muted-foreground">
        {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
      </span>
      <span className="w-20 shrink-0 text-right text-xs text-muted-foreground">
        {collection.updatedAt.toLocaleDateString()}
      </span>
    </div>
  );
}
