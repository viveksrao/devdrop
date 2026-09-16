import { Layers } from "lucide-react";
import { SidebarSection, SidebarLink } from "@/components/layout/SidebarLink";
import { ITEM_TYPE_ICONS, ITEM_TYPE_LABELS, PRO_ONLY_TYPES } from "@/lib/constants/item-types";
import type { SystemItemType } from "@/lib/db/items";

interface SidebarTypesSectionProps {
  itemTypes: SystemItemType[];
  collapsed: boolean;
  pathname: string;
}

export function SidebarTypesSection({ itemTypes, collapsed, pathname }: SidebarTypesSectionProps) {
  return (
    <SidebarSection title="Types" collapsed={collapsed}>
      {itemTypes.map((type) => {
        const Icon = ITEM_TYPE_ICONS[type.name] ?? Layers;
        const label = ITEM_TYPE_LABELS[type.name] ?? type.name;
        const isPro = PRO_ONLY_TYPES.has(type.name);

        const href = `/items/${type.name}s`;

        return (
          <SidebarLink
            key={type.id}
            href={href}
            icon={Icon}
            label={label}
            iconColor={type.color}
            collapsed={collapsed}
            isActive={pathname === href}
            badge={isPro ? "PRO" : undefined}
            trailing={<span className="text-xs text-muted-foreground">{type.itemCount}</span>}
          />
        );
      })}
    </SidebarSection>
  );
}
