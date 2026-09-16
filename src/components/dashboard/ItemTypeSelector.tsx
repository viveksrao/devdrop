import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ITEM_TYPE_ICONS, ITEM_TYPE_LABELS, PRO_ONLY_TYPES } from "@/lib/constants/item-types";
import { cn } from "@/lib/utils";

interface ItemTypeSelectorProps<T extends string> {
  types: readonly T[];
  value: T;
  onChange: (type: T) => void;
  isPro: boolean;
}

export function ItemTypeSelector<T extends string>({
  types,
  value,
  onChange,
  isPro,
}: ItemTypeSelectorProps<T>) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>Type</Label>
      <div className="flex flex-wrap gap-1.5">
        {types.map((type) => {
          const Icon = ITEM_TYPE_ICONS[type];
          const label = (ITEM_TYPE_LABELS[type] ?? type).replace(/s$/, "");
          const selected = value === type;
          const locked = PRO_ONLY_TYPES.has(type) && !isPro;
          return (
            <button
              key={type}
              type="button"
              disabled={locked}
              onClick={() => onChange(type)}
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm transition-colors",
                selected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
                locked && "cursor-not-allowed opacity-50 hover:text-muted-foreground"
              )}
            >
              <Icon className="size-3.5" />
              {label}
              {locked && (
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  PRO
                </Badge>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
