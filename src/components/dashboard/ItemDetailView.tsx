import { Download, FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItemContentField } from "@/components/dashboard/ItemContentField";
import { TagBadgeList } from "@/components/dashboard/TagBadgeList";
import { formatFileSize } from "@/lib/constants/file-upload";
import { CODE_TYPES } from "@/lib/constants/item-types";
import type { ItemDetail } from "@/lib/db/items";

interface ItemDetailViewProps {
  item: ItemDetail;
}

export function ItemDetailView({ item }: ItemDetailViewProps) {
  return (
    <div className="flex min-w-0 flex-col gap-4 overflow-y-auto px-4 pb-4">
      {item.description && (
        <div>
          <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Description
          </h3>
          <p className="mt-1.5 text-sm">{item.description}</p>
        </div>
      )}

      {item.contentType === "TEXT" && item.content && (
        <div className="min-w-0">
          <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Content{item.language && !CODE_TYPES.has(item.itemType.name) ? ` · ${item.language}` : ""}
          </h3>
          <div className="mt-1.5">
            <ItemContentField
              itemTypeName={item.itemType.name}
              value={item.content}
              language={item.language}
              readOnly
            />
          </div>
        </div>
      )}

      {item.contentType === "URL" && item.url && (
        <div>
          <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            URL
          </h3>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 block break-all text-sm text-primary underline-offset-4 hover:underline"
          >
            {item.url}
          </a>
        </div>
      )}

      {item.contentType === "FILE" && item.fileName && (
        <div className="min-w-0">
          <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {item.itemType.name === "image" ? "Image" : "File"}
          </h3>
          <div className="mt-1.5 flex items-center gap-3 rounded-md border border-border p-3">
            {item.itemType.name === "image" && item.fileUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.fileUrl}
                alt={item.fileName}
                className="size-12 shrink-0 rounded object-cover"
              />
            ) : (
              <FileIcon className="size-8 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.fileName}</p>
              {item.fileSize !== null && (
                <p className="text-xs text-muted-foreground">{formatFileSize(item.fileSize)}</p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              nativeButton={false}
              render={<a href={`/api/download/${item.id}`} />}
            >
              <Download />
              Download
            </Button>
          </div>
        </div>
      )}

      <TagBadgeList label="Tags" items={item.tags} variant="secondary" />
      <TagBadgeList
        label="Collections"
        items={item.collections.map((collection) => collection.name)}
        variant="outline"
      />
    </div>
  );
}
