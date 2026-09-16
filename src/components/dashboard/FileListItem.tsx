"use client";

import { Download, File, FileCode, FileJson, FileSpreadsheet, FileText, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useItemDrawer } from "@/components/dashboard/ItemDrawerProvider";
import { formatFileSize, getFileIconName } from "@/lib/constants/file-upload";
import { useToggleItemFavorite } from "@/hooks/useToggleItemFavorite";
import type { ItemWithType } from "@/lib/db/items";

interface FileListItemProps {
  item: ItemWithType;
}

const FILE_ICON_COMPONENTS: Record<string, LucideIcon> = {
  FileText,
  FileJson,
  FileCode,
  FileSpreadsheet,
  File,
};

export function FileListItem({ item }: FileListItemProps) {
  const { openItem } = useItemDrawer();
  const { isToggling: isTogglingFavorite, toggleFavorite: handleToggleFavorite } =
    useToggleItemFavorite(item.id);
  const Icon = FILE_ICON_COMPONENTS[getFileIconName(item.fileName ?? item.title)];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => openItem(item.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openItem(item.id);
        }
      }}
      className="flex cursor-pointer flex-col gap-2 rounded-md border border-border p-3 transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:gap-3"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Icon className="size-6 shrink-0 text-muted-foreground" />
        <span className="min-w-0 truncate font-medium">{item.fileName ?? item.title}</span>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {item.fileSize !== null && <span>{formatFileSize(item.fileSize)}</span>}
          <span>{item.createdAt.toLocaleDateString()}</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className={
            item.isFavorite
              ? "text-yellow-500 hover:text-yellow-500"
              : "text-muted-foreground hover:text-foreground"
          }
          onClick={handleToggleFavorite}
          disabled={isTogglingFavorite}
          aria-label={item.isFavorite ? "Unfavorite" : "Favorite"}
        >
          <Star className={item.isFavorite ? "fill-yellow-500" : undefined} />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          nativeButton={false}
          render={<a href={`/api/download/${item.id}`} />}
          onClick={(e) => e.stopPropagation()}
        >
          <Download />
          Download
        </Button>
      </div>
    </div>
  );
}
