import Link from "next/link";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ITEM_TYPE_ICONS } from "@/lib/constants/item-types";
import type { CollectionWithStats } from "@/lib/db/collections";

interface CollectionCardProps {
  collection: CollectionWithStats;
}

export function CollectionCard({ collection }: CollectionCardProps) {
  return (
    <Link href={`/collections/${collection.id}`}>
      <Card
        className="h-full transition-colors hover:bg-muted/50"
        style={{
          ["--tw-ring-color" as string]: collection.dominantColor
            ? `${collection.dominantColor}80`
            : undefined,
        }}
      >
        <CardContent className="flex h-full flex-col gap-3">
          <h3 className="flex items-center gap-1.5 font-medium">
            {collection.name}
            {collection.isFavorite && (
              <Star className="size-3.5 fill-current text-yellow-400" />
            )}
          </h3>
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
    </Link>
  );
}
