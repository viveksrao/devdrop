"use client";

import { FolderPlus, Plus, Search, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useGlobalSearch } from "@/components/dashboard/GlobalSearchProvider";

interface DashboardTopBarUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface DashboardTopBarProps {
  sidebarTrigger?: React.ReactNode;
  user: DashboardTopBarUser;
  onNewItem?: () => void;
  onNewCollection?: () => void;
}

export function DashboardTopBar({
  sidebarTrigger,
  user,
  onNewItem,
  onNewCollection,
}: DashboardTopBarProps) {
  const { open } = useGlobalSearch();

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-border px-6">
      <div className="flex flex-1 items-center gap-4">
        {sidebarTrigger}
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search snippets, prompts, tags... (⌘K)"
            className="cursor-pointer pl-9"
            readOnly
            onClick={open}
            aria-label="Open search"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={onNewCollection}>
          <FolderPlus />
          New Collection
        </Button>
        <Button onClick={onNewItem}>
          <Plus />
          New Item
        </Button>
        <Button variant="ghost" size="icon" aria-label="Settings">
          <Settings />
        </Button>
        <UserAvatar name={user.name} email={user.email} image={user.image} />
      </div>
    </header>
  );
}
