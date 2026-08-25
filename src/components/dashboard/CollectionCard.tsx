"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreVertical, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ITEM_TYPE_ICONS } from "@/lib/constants/item-types";
import type { CollectionWithStats } from "@/lib/db/collections";
import { useCollectionActions } from "@/components/dashboard/CollectionActionsMenu";

interface CollectionCardProps {
  collection: CollectionWithStats;
}

export function CollectionCard({ collection }: CollectionCardProps) {
  const router = useRouter();
  const { dialogs, openEdit, openDelete } = useCollectionActions(collection);

  return (
    <>
      <Card
        className="h-full cursor-pointer transition-colors hover:bg-muted/50"
        style={{
          ["--tw-ring-color" as string]: collection.dominantColor
            ? `${collection.dominantColor}80`
            : undefined,
        }}
        onClick={() => router.push(`/collections/${collection.id}`)}
      >
        <CardContent className="flex h-full flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/collections/${collection.id}`}
              className="flex min-w-0 items-center gap-1.5 font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="truncate">{collection.name}</span>
              {collection.isFavorite && (
                <Star className="size-3.5 shrink-0 fill-current text-yellow-400" />
              )}
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0"
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  />
                }
              >
                <MoreVertical className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              >
                <DropdownMenuItem onClick={openEdit}>Edit</DropdownMenuItem>
                <DropdownMenuItem>Favorite</DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={openDelete}>
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="line-clamp-2 flex-1 text-sm text-muted-foreground">
            {collection.description}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {collection.types.map((type) => {
                const Icon = ITEM_TYPE_ICONS[type.name];
                if (!Icon) return null;
                return (
                  <span
                    key={type.name}
                    className="flex size-6 items-center justify-center rounded-md"
                    style={{ backgroundColor: `${type.color}1a`, color: type.color }}
                  >
                    <Icon className="size-3.5" />
                  </span>
                );
              })}
            </div>
            <span className="text-xs text-muted-foreground">
              {collection.itemCount} items
            </span>
          </div>
        </CardContent>
      </Card>
      {dialogs}
    </>
  );
}
