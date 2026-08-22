"use client";

import { ImageOff, Pin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useItemDrawer } from "@/components/dashboard/ItemDrawerProvider";
import type { ItemWithType } from "@/lib/db/items";

interface ImageCardProps {
  item: ItemWithType;
}

export function ImageCard({ item }: ImageCardProps) {
  const { openItem } = useItemDrawer();

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
      className="cursor-pointer overflow-hidden py-0 ring-foreground/10 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--image-card-focus-ring)"
      style={{ ["--image-card-focus-ring" as string]: `${item.itemType.color}80` }}
    >
      <div className="aspect-video overflow-hidden">
        {item.fileUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.fileUrl}
            alt={item.title}
            className="size-full object-cover transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-muted">
            <ImageOff className="size-8 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex items-start justify-between gap-2 p-3">
        <h3 className="min-w-0 truncate font-medium">{item.title}</h3>
        {item.isPinned && (
          <Pin className="size-3.5 shrink-0 text-muted-foreground" />
        )}
      </div>
    </Card>
  );
}
