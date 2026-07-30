import { Pin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ITEM_TYPE_ICONS, ITEM_TYPE_LABELS } from "@/lib/constants/item-types";
import type { ItemWithType } from "@/lib/db/items";

interface ItemCardProps {
  item: ItemWithType;
}

export function ItemCard({ item }: ItemCardProps) {
  const { itemType } = item;
  const Icon = ITEM_TYPE_ICONS[itemType.name];
  const label = ITEM_TYPE_LABELS[itemType.name] ?? itemType.name;

  return (
    <Card
      className="h-full border-l-4"
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
          {item.isPinned && (
            <Pin className="size-3.5 shrink-0 text-muted-foreground" />
          )}
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
