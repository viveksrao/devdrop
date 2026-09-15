"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Star,
  Layers,
  Puzzle,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { SidebarUserFooter } from "@/components/layout/SidebarUserFooter";
import {
  ITEM_TYPE_ICONS,
  ITEM_TYPE_LABELS,
  PRO_ONLY_TYPES,
} from "@/lib/constants/item-types";
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
                trailing={
                  <span className="text-xs text-muted-foreground">
                    {type.itemCount}
                  </span>
                }
              />
            );
          })}
        </SidebarSection>

        <Separator className="my-4" />

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
          {recentCollections.map((collection) => {
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
      </div>

      {!user.isPro && !collapsed && (
        <div className="m-3 rounded-lg border border-border bg-card p-3">
          <p className="text-sm font-medium">Upgrade to Pro</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Unlock AI features, files &amp; unlimited items.
          </p>
        </div>
      )}

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

interface SidebarSectionProps {
  title: string;
  collapsed: boolean;
  action?: React.ReactNode;
  children: React.ReactNode;
}

function SidebarSection({ title, collapsed, action, children }: SidebarSectionProps) {
  return (
    <div>
      {!collapsed && (
        <div className="mb-2 flex items-center justify-between px-2">
          <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {title}
          </span>
          {action}
        </div>
      )}
      <nav className="flex flex-col gap-0.5">{children}</nav>
    </div>
  );
}

interface SidebarLinkProps {
  href: string;
  icon?: LucideIcon;
  iconNode?: React.ReactNode;
  label: string;
  iconColor?: string;
  collapsed: boolean;
  isActive?: boolean;
  badge?: string;
  trailing?: React.ReactNode;
}

function SidebarLink({
  href,
  icon: Icon,
  iconNode,
  label,
  iconColor,
  collapsed,
  isActive,
  badge,
  trailing,
}: SidebarLinkProps) {
  const link = (
    <Link
      href={href}
      aria-label={collapsed ? label : undefined}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        collapsed && "justify-center px-0",
        isActive && "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
      )}
    >
      {iconNode ?? (
        Icon && (
          <Icon
            className="size-4 shrink-0"
            style={iconColor ? { color: iconColor } : undefined}
          />
        )
      )}
      {!collapsed && (
        <>
          <span className="flex flex-1 items-center gap-2 truncate">
            <span className="truncate">{label}</span>
            {badge && (
              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                {badge}
              </Badge>
            )}
          </span>
          {trailing}
        </>
      )}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger render={link} />
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}
