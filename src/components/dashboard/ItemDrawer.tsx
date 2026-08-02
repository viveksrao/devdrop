"use client";

import { useEffect, useState } from "react";
import { Copy, Pencil, Pin, Star, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ITEM_TYPE_ICONS, ITEM_TYPE_LABELS } from "@/lib/constants/item-types";
import type { ItemDetail } from "@/lib/db/items";

interface ItemDrawerProps {
  itemId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ItemDrawer({ itemId, open, onOpenChange }: ItemDrawerProps) {
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loadedItemId, setLoadedItemId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !itemId) return;

    let cancelled = false;

    fetch(`/api/items/${itemId}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((json) => {
        if (cancelled) return;
        setItem(json.data);
        setLoadedItemId(itemId);
      })
      .catch(() => {
        if (!cancelled) {
          setItem(null);
          setLoadedItemId(itemId);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, itemId]);

  const loading = itemId !== null && loadedItemId !== itemId;

  const Icon = item ? ITEM_TYPE_ICONS[item.itemType.name] : undefined;
  const label = item ? (ITEM_TYPE_LABELS[item.itemType.name] ?? item.itemType.name).replace(/s$/, "") : "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full min-w-0 sm:max-w-lg" side="right">
        {loading || !item ? (
          <ItemDrawerSkeleton />
        ) : (
          <>
            <SheetHeader className="gap-1 pr-10">
              <div
                className="flex items-center gap-1.5 text-xs font-medium"
                style={{ color: item.itemType.color }}
              >
                {Icon && <Icon className="size-3.5" />}
                {label}
              </div>
              <SheetTitle className="text-lg">{item.title}</SheetTitle>
            </SheetHeader>

            <div className="flex flex-wrap items-center gap-1 border-b px-4 pb-4">
              <Button variant="ghost" size="sm">
                <Copy />
                Copy
              </Button>
              <Button variant="ghost" size="sm">
                <Pencil />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={item.isFavorite ? "text-yellow-500" : undefined}
              >
                <Star className={item.isFavorite ? "fill-yellow-500" : undefined} />
                Favorite
              </Button>
              <Button variant="ghost" size="sm">
                <Pin />
                Pin
              </Button>
              <Button variant="ghost" size="sm" className="ml-auto text-destructive">
                <Trash2 />
                Delete
              </Button>
            </div>

            <div className="flex min-w-0 flex-col gap-4 overflow-y-auto px-4 pb-4">
              {item.description && (
                <div>
                  <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Description
                  </h3>
                  <p className="mt-1.5 text-sm">{item.description}</p>
                </div>
              )}

              {item.contentType === "TEXT" && item.content && (
                <div className="min-w-0">
                  <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Content{item.language ? ` · ${item.language}` : ""}
                  </h3>
                  <pre className="mt-1.5 min-w-0 overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs">
                    <code>{item.content}</code>
                  </pre>
                </div>
              )}

              {item.contentType === "URL" && item.url && (
                <div>
                  <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    URL
                  </h3>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 block break-all text-sm text-primary underline-offset-4 hover:underline"
                  >
                    {item.url}
                  </a>
                </div>
              )}

              {item.contentType === "FILE" && item.fileName && (
                <div>
                  <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    File
                  </h3>
                  <p className="mt-1.5 text-sm">{item.fileName}</p>
                </div>
              )}

              {item.tags.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Tags
                  </h3>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {item.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-muted-foreground">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {item.collections.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Collections
                  </h3>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {item.collections.map((collection) => (
                      <Badge key={collection.id} variant="outline">
                        {collection.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-auto border-t p-4 text-xs text-muted-foreground">
              Last updated {formatRelativeTime(item.updatedAt)}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ItemDrawerSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-3/4" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-14" />
      </div>
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

function formatRelativeTime(date: string | Date): string {
  const then = new Date(date).getTime();
  const diffMs = Date.now() - then;
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;

  return new Date(date).toLocaleDateString();
}
