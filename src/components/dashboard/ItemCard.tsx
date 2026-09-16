"use client";

import { useState } from "react";
import { Check, Copy, Pin, Star } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ITEM_TYPE_ICONS, ITEM_TYPE_LABELS } from "@/lib/constants/item-types";
import { useItemDrawer } from "@/components/dashboard/ItemDrawerProvider";
import { useToggleItemFavorite } from "@/hooks/useToggleItemFavorite";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import type { ItemDetail, ItemWithType } from "@/lib/db/items";

interface ItemCardProps {
  item: ItemWithType;
}

export function ItemCard({ item }: ItemCardProps) {
  const { itemType } = item;
  const Icon = ITEM_TYPE_ICONS[itemType.name];
  const label = ITEM_TYPE_LABELS[itemType.name] ?? itemType.name;
  const { openItem } = useItemDrawer();
  const { copied, copy } = useCopyToClipboard();
  const [copying, setCopying] = useState(false);
  const { isToggling: isTogglingFavorite, toggleFavorite: handleToggleFavorite } =
    useToggleItemFavorite(item.id);

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    if (copying) return;
    setCopying(true);
    try {
      const response = await fetch(`/api/items/${item.id}`);
      const result: { success: boolean; data?: ItemDetail } = await response.json();
      if (!result.success || !result.data) {
        throw new Error("Failed to load item");
      }
      const value = result.data.contentType === "URL" ? result.data.url : result.data.content;
      if (!value) {
        throw new Error("Nothing to copy");
      }
      await copy(value);
    } catch {
      toast.error("Failed to copy");
    } finally {
      setCopying(false);
    }
  }

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => openItem(item.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openItem(item.id);
        }
      }}
      className="h-full cursor-pointer border-l-4 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2"
      style={{
        borderLeftColor: itemType.color,
        ["--tw-ring-color" as string]: `${itemType.color}80`,
      }}
    >
      <CardContent className="flex h-full flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <span
            className="flex items-center gap-1.5 text-xs font-medium"
            style={{ color: itemType.color }}
          >
            {Icon && <Icon className="size-3.5" />}
            {label.replace(/s$/, "")}
          </span>
          <div className="flex shrink-0 items-center gap-1">
            {item.isPinned && (
              <Pin className="size-3.5 text-muted-foreground" />
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className={
                item.isFavorite
                  ? "text-yellow-500 hover:text-yellow-500"
                  : "text-muted-foreground hover:text-foreground"
              }
              onClick={handleToggleFavorite}
              disabled={isTogglingFavorite}
              aria-label={item.isFavorite ? "Unfavorite" : "Favorite"}
            >
              <Star className={item.isFavorite ? "fill-yellow-500" : undefined} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground hover:text-foreground"
              onClick={handleCopy}
              aria-label="Copy"
            >
              {copied ? <Check className="text-emerald-500" /> : <Copy />}
            </Button>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="font-medium">{item.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {item.description}
          </p>
        </div>
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-muted-foreground">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
