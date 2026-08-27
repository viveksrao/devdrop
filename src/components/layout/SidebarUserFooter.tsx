"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, Settings } from "lucide-react";
import { UserAvatar } from "@/components/shared/UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface SidebarUserFooterProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  collapsed: boolean;
}

export function SidebarUserFooter({ name, email, image, collapsed }: SidebarUserFooterProps) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-sidebar-accent",
          collapsed && "justify-center px-0"
        )}
      >
        <UserAvatar name={name} email={email} image={image} size="sm" />
        {!collapsed && (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">
              {name ?? "Account"}
            </span>
            {email && (
              <span className="block truncate text-xs text-muted-foreground">
                {email}
              </span>
            )}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-56">
        <DropdownMenuItem render={<Link href="/profile" />}>
          <UserAvatar name={name} email={email} image={image} size="sm" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm">{name ?? "Account"}</span>
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/settings" />}>
          <Settings />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={() => {
            void signOut({ redirectTo: "/sign-in" }).then(() => router.refresh());
          }}
        >
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
