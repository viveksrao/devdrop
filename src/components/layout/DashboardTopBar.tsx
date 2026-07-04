import { Plus, Search, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { currentUser } from "@/lib/mock-data";

interface DashboardTopBarProps {
  sidebarTrigger?: React.ReactNode;
}

export function DashboardTopBar({ sidebarTrigger }: DashboardTopBarProps) {
  const initials = currentUser.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-border px-6">
      <div className="flex flex-1 items-center gap-4">
        {sidebarTrigger}
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search snippets, prompts, tags..."
            className="pl-9"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button>
          <Plus />
          New item
        </Button>
        <Button variant="ghost" size="icon" aria-label="Settings">
          <Settings />
        </Button>
        <Avatar>
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
