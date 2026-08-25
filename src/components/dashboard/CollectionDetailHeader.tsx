"use client";

import { Pencil, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCollectionActions } from "@/components/dashboard/CollectionActionsMenu";

interface CollectionDetailHeaderProps {
  collection: { id: string; name: string; description: string | null; isFavorite: boolean };
  itemCount: number;
}

export function CollectionDetailHeader({ collection, itemCount }: CollectionDetailHeaderProps) {
  const { dialogs, openEdit, openDelete } = useCollectionActions(collection);

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          {collection.name}
          {collection.isFavorite && (
            <Star className="size-5 fill-current text-yellow-400" />
          )}
        </h1>
        {collection.description && (
          <p className="mt-1 text-muted-foreground">{collection.description}</p>
        )}
        <p className="mt-1 text-sm text-muted-foreground">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Favorite collection">
          <Star className={collection.isFavorite ? "fill-yellow-500 text-yellow-500" : undefined} />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Edit collection" onClick={openEdit}>
          <Pencil />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Delete collection"
          className="text-destructive"
          onClick={openDelete}
        >
          <Trash2 />
        </Button>
      </div>

      {dialogs}
    </div>
  );
}
