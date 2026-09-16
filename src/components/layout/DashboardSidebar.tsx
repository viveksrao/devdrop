"use client";

import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Puzzle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { SidebarUserFooter } from "@/components/layout/SidebarUserFooter";
import { SidebarTypesSection } from "@/components/layout/SidebarTypesSection";
import { SidebarCollectionsSection } from "@/components/layout/SidebarCollectionsSection";
import { SidebarUpgradeBanner } from "@/components/layout/SidebarUpgradeBanner";
import type { SystemItemType } from "@/lib/db/items";
import type { CollectionWithStats } from "@/lib/db/collections";

interface SidebarUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  isPro: boolean;
}

interface DashboardSidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  className?: string;
  itemTypes: SystemItemType[];
  recentCollections: CollectionWithStats[];
  user: SidebarUser;
}

export function DashboardSidebar({
  collapsed,
  onToggleCollapsed,
  className,
  itemTypes,
  recentCollections,
  user,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-[width] duration-200",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      <div
        className={cn(
          "flex h-16 shrink-0 items-center gap-2 border-b border-border px-4",
          collapsed && "justify-center px-0"
        )}
      >
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
          <Puzzle className="size-4" />
        </div>
        {!collapsed && (
          <span className="font-heading text-base font-semibold">DevDrop</span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <SidebarTypesSection itemTypes={itemTypes} collapsed={collapsed} pathname={pathname} />

        <Separator className="my-4" />

        <SidebarCollectionsSection
          collections={recentCollections}
          collapsed={collapsed}
          pathname={pathname}
        />
      </div>

      {!user.isPro && !collapsed && <SidebarUpgradeBanner />}

      <Separator />
      <SidebarUserFooter
        name={user.name}
        email={user.email}
        image={user.image}
        collapsed={collapsed}
      />
      <Separator />
      <button
        type="button"
        onClick={onToggleCollapsed}
        className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground hover:text-foreground"
      >
        {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        {!collapsed && "Collapse"}
      </button>
    </aside>
  );
}
