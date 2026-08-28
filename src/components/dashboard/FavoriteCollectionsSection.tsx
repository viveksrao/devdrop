"use client";

import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FavoriteCollectionRow } from "@/components/dashboard/FavoriteCollectionRow";
import type { CollectionWithStats } from "@/lib/db/collections";

const COLLECTION_SORT_OPTIONS = ["date", "name"] as const;
type CollectionSort = (typeof COLLECTION_SORT_OPTIONS)[number];

const COLLECTION_SORT_LABELS: Record<CollectionSort, string> = {
  date: "Date",
  name: "Name",
};

function sortCollections(
  collections: CollectionWithStats[],
  sort: CollectionSort
): CollectionWithStats[] {
  const sorted = [...collections];
  switch (sort) {
    case "name":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "date":
    default:
      return sorted.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }
}

interface FavoriteCollectionsSectionProps {
  collections: CollectionWithStats[];
}

export function FavoriteCollectionsSection({ collections }: FavoriteCollectionsSectionProps) {
  const [sort, setSort] = useState<CollectionSort>("date");
  const sortedCollections = useMemo(() => sortCollections(collections, sort), [collections, sort]);

  return (
    <section>
      <div className="flex items-center justify-between gap-2 px-2">
        <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Collections ({collections.length})
        </h2>
        {collections.length > 1 && (
          <Select value={sort} onValueChange={(value) => setSort(value as CollectionSort)}>
            <SelectTrigger size="sm" className="w-32 text-xs" aria-label="Sort collections by">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COLLECTION_SORT_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {COLLECTION_SORT_LABELS[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      {collections.length === 0 ? (
        <p className="px-2 py-1.5 text-sm text-muted-foreground">No favorited collections.</p>
      ) : (
        <div className="mt-1 flex flex-col divide-y divide-border">
          {sortedCollections.map((collection) => (
            <FavoriteCollectionRow key={collection.id} collection={collection} />
          ))}
        </div>
      )}
    </section>
  );
}
