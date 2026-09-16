import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface SidebarSectionProps {
  title: string;
  collapsed: boolean;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function SidebarSection({ title, collapsed, action, children }: SidebarSectionProps) {
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

export function SidebarLink({
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
