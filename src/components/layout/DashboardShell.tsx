"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardTopBar } from "@/components/layout/DashboardTopBar";
import type { SystemItemType } from "@/lib/db/items";
import type { CollectionWithStats } from "@/lib/db/collections";

interface DashboardShellProps {
  children: React.ReactNode;
  itemTypes: SystemItemType[];
  recentCollections: CollectionWithStats[];
}

export function DashboardShell({
  children,
  itemTypes,
  recentCollections,
}: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <DashboardSidebar
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((c) => !c)}
          className="hidden lg:flex"
          itemTypes={itemTypes}
          recentCollections={recentCollections}
        />
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-72 p-0 lg:hidden">
            <SheetTitle className="sr-only">Sidebar</SheetTitle>
            <DashboardSidebar
              collapsed={false}
              onToggleCollapsed={() => setMobileOpen(false)}
              className="flex w-full border-r-0"
              itemTypes={itemTypes}
              recentCollections={recentCollections}
            />
          </SheetContent>
        </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopBar
        sidebarTrigger={
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open sidebar"
            onClick={() => setMobileOpen(true)}
          >
            <Menu />
          </Button>
        }
      />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      
      
    </div>
  );
}
