import Link from "next/link";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Collection } from "@/lib/mock-data";

interface CollectionCardProps {
  collection: Collection;
}

export function CollectionCard({ collection }: CollectionCardProps) {
  return (
    <Link href={`/collections/${collection.id}`}>
      <Card className="h-full transition-colors hover:bg-muted/50">
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
          <span className="text-xs text-muted-foreground">
            {collection.itemCount} items
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
