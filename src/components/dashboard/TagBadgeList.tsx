import { Badge } from "@/components/ui/badge";

interface TagBadgeListProps {
  label: string;
  items: string[];
  variant?: "outline" | "secondary";
}

export function TagBadgeList({ label, items, variant = "secondary" }: TagBadgeListProps) {
  if (items.length === 0) return null;

  return (
    <div>
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </h3>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <Badge
            key={item}
            variant={variant}
            className={variant === "secondary" ? "text-muted-foreground" : undefined}
          >
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}
