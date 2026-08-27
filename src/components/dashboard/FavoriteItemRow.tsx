"use client";

import { ITEM_TYPE_ICONS, ITEM_TYPE_LABELS } from "@/lib/constants/item-types";
import { useItemDrawer } from "@/components/dashboard/ItemDrawerProvider";
import type { ItemWithType } from "@/lib/db/items";

interface FavoriteItemRowProps {
  item: ItemWithType;
}

export function FavoriteItemRow({ item }: FavoriteItemRowProps) {
  const { itemType } = item;
  const Icon = ITEM_TYPE_ICONS[itemType.name];
  const label = ITEM_TYPE_LABELS[itemType.name] ?? itemType.name;
  const { openItem } = useItemDrawer();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => openItem(item.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openItem(item.id);
        }
      }}
      className="flex cursor-pointer items-center gap-3 px-2 py-1.5 font-mono text-sm transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      {Icon && <Icon className="size-3.5 shrink-0" style={{ color: itemType.color }} />}
      <span className="min-w-0 flex-1 truncate">{item.title}</span>
      <span
        className="shrink-0 text-xs uppercase"
        style={{ color: itemType.color }}
      >
        {label.replace(/s$/, "")}
      </span>
      <span className="w-20 shrink-0 text-right text-xs text-muted-foreground">
        {item.updatedAt.toLocaleDateString()}
      </span>
    </div>
  );
}
