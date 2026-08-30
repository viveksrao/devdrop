"use client";

import Link from "next/link";
import { FolderPlus, Plus, Search, Sparkles, Star } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useGlobalSearch } from "@/components/dashboard/GlobalSearchProvider";
import { cn } from "@/lib/utils";

interface DashboardTopBarUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  isPro?: boolean;
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
    <header className="flex h-16 items-center justify-between gap-2 border-b border-border px-4 sm:gap-4 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
        {sidebarTrigger}
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search... (⌘K)"
            className="cursor-pointer pl-9"
            readOnly
            onClick={open}
            aria-label="Open search"
          />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        {!user.isPro && (
          <Link
            href="/upgrade"
            aria-label="Upgrade"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "sm:h-8 sm:w-auto sm:gap-1.5 sm:px-2.5"
            )}
          >
            <Sparkles />
            <span className="hidden sm:inline">Upgrade</span>
          </Link>
        )}
        <Button
          variant="secondary"
          size="icon"
          onClick={onNewCollection}
          className="sm:hidden"
          aria-label="New Collection"
        >
          <FolderPlus />
        </Button>
        <Button
          variant="secondary"
          onClick={onNewCollection}
          className="hidden sm:inline-flex"
        >
          <FolderPlus />
          New Collection
        </Button>
        <Button
          size="icon"
          onClick={onNewItem}
          className="sm:hidden"
          aria-label="New Item"
        >
          <Plus />
        </Button>
        <Button onClick={onNewItem} className="hidden sm:inline-flex">
          <Plus />
          New Item
        </Button>
        <Link
          href="/favorites"
          aria-label="Favorites"
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <Star />
        </Link>
        <UserAvatar name={user.name} email={user.email} image={user.image} />
      </div>
    </header>
  );
}
