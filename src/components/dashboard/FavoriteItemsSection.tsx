"use client";

import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FavoriteItemRow } from "@/components/dashboard/FavoriteItemRow";
import { ITEM_TYPE_LABELS } from "@/lib/constants/item-types";
import type { ItemWithType } from "@/lib/db/items";

const ITEM_SORT_OPTIONS = ["date", "name", "type"] as const;
type ItemSort = (typeof ITEM_SORT_OPTIONS)[number];

const ITEM_SORT_LABELS: Record<ItemSort, string> = {
  date: "Date",
  name: "Name",
  type: "Item Type",
};

function sortItems(items: ItemWithType[], sort: ItemSort): ItemWithType[] {
  const sorted = [...items];
  switch (sort) {
    case "name":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case "type":
      return sorted.sort((a, b) => {
        const labelA = ITEM_TYPE_LABELS[a.itemType.name] ?? a.itemType.name;
        const labelB = ITEM_TYPE_LABELS[b.itemType.name] ?? b.itemType.name;
        return labelA.localeCompare(labelB) || a.title.localeCompare(b.title);
      });
    case "date":
    default:
      return sorted.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }
}

interface FavoriteItemsSectionProps {
  items: ItemWithType[];
}

export function FavoriteItemsSection({ items }: FavoriteItemsSectionProps) {
  const [sort, setSort] = useState<ItemSort>("date");
  const sortedItems = useMemo(() => sortItems(items, sort), [items, sort]);

  return (
    <section>
      <div className="flex items-center justify-between gap-2 px-2">
        <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Items ({items.length})
        </h2>
        {items.length > 1 && (
          <Select value={sort} onValueChange={(value) => setSort(value as ItemSort)}>
            <SelectTrigger size="sm" className="w-32 text-xs" aria-label="Sort items by">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ITEM_SORT_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {ITEM_SORT_LABELS[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      {items.length === 0 ? (
        <p className="px-2 py-1.5 text-sm text-muted-foreground">No favorited items.</p>
      ) : (
        <div className="mt-1 flex flex-col divide-y divide-border">
          {sortedItems.map((item) => (
            <FavoriteItemRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
