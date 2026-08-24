import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { CollectionOption } from "@/lib/db/collections";

interface CollectionPickerProps {
  collections: CollectionOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function CollectionPicker({ collections, selectedIds, onChange }: CollectionPickerProps) {
  if (collections.length === 0) return null;

  function toggle(id: string) {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((selectedId) => selectedId !== id)
        : [...selectedIds, id]
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label>Collections</Label>
      <div className="flex flex-wrap gap-1.5">
        {collections.map((collection) => {
          const selected = selectedIds.includes(collection.id);
          return (
            <button
              key={collection.id}
              type="button"
              onClick={() => toggle(collection.id)}
              className={cn(
                "rounded-md border px-2.5 py-1.5 text-sm transition-colors",
                selected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {collection.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
