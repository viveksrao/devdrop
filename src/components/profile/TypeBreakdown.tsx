import { Card, CardContent } from "@/components/ui/card";
import { ITEM_TYPE_ICONS, ITEM_TYPE_LABELS } from "@/lib/constants/item-types";
import type { SystemItemType } from "@/lib/db/items";

interface TypeBreakdownProps {
  types: SystemItemType[];
}

export function TypeBreakdown({ types }: TypeBreakdownProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {types.map((type) => {
        const Icon = ITEM_TYPE_ICONS[type.name];
        const label = ITEM_TYPE_LABELS[type.name] ?? type.name;

        return (
          <Card key={type.id}>
            <CardContent className="flex items-center gap-3">
              <div
                className="flex size-9 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${type.color}1a`, color: type.color }}
              >
                {Icon && <Icon className="size-4.5" />}
              </div>
              <div className="min-w-0">
                <p className="text-xl font-semibold leading-tight">{type.itemCount}</p>
                <p className="truncate text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
