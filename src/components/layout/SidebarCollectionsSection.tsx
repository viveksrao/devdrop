import { Layers, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarSection, SidebarLink } from "@/components/layout/SidebarLink";
import type { CollectionWithStats } from "@/lib/db/collections";

interface SidebarCollectionsSectionProps {
  collections: CollectionWithStats[];
  collapsed: boolean;
  pathname: string;
}

export function SidebarCollectionsSection({
  collections,
  collapsed,
  pathname,
}: SidebarCollectionsSectionProps) {
  return (
    <SidebarSection
      title="Collections"
      collapsed={collapsed}
      action={
        !collapsed && (
          <Button variant="ghost" size="icon-xs" aria-label="New collection">
            <Plus />
          </Button>
        )
      }
    >
      {collections.map((collection) => {
        const href = `/collections/${collection.id}`;

        return (
          <SidebarLink
            key={collection.id}
            href={href}
            iconNode={
              <span className="flex size-4 shrink-0 items-center justify-center">
                <span
                  className="size-2.5 rounded-full"
                  style={{
                    backgroundColor: collection.dominantColor ?? "var(--muted-foreground)",
                  }}
                />
              </span>
            }
            label={collection.name}
            collapsed={collapsed}
            isActive={pathname === href}
            trailing={
              collection.isFavorite ? (
                <Star className="size-3.5 fill-current text-yellow-400" />
              ) : undefined
            }
          />
        );
      })}
      <SidebarLink
        href="/collections"
        icon={Layers}
        label="View all collections"
        collapsed={collapsed}
        isActive={pathname === "/collections"}
      />
    </SidebarSection>
  );
}
