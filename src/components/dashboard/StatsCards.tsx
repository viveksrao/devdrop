import { Layers, Folder, Star, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { ItemStats } from "@/lib/db/items";
import type { CollectionStats } from "@/lib/db/collections";

interface StatsCardsProps {
  itemStats: ItemStats;
  collectionStats: CollectionStats;
}

export function StatsCards({ itemStats, collectionStats }: StatsCardsProps) {
  const stats = [
    {
      label: "Total items",
      value: itemStats.totalItems,
      icon: Layers,
    },
    {
      label: "Collections",
      value: collectionStats.totalCollections,
      icon: Folder,
    },
    {
      label: "Favorite items",
      value: itemStats.favoriteItems,
      icon: Heart,
    },
    {
      label: "Favorite collections",
      value: collectionStats.favoriteCollections,
      icon: Star,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <stat.icon className="size-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-semibold leading-tight">{stat.value}</p>
              <p className="truncate text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
