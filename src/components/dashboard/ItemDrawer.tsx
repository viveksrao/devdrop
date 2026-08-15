"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Pencil, Pin, Star, Trash2, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CodeEditor } from "@/components/dashboard/CodeEditor";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ITEM_TYPE_ICONS, ITEM_TYPE_LABELS } from "@/lib/constants/item-types";
import type { ItemDetail } from "@/lib/db/items";
import { updateItem, deleteItem } from "@/actions/items";

const TEXT_CONTENT_TYPES = new Set(["snippet", "prompt", "command", "note"]);
const LANGUAGE_TYPES = new Set(["snippet", "command"]);
const CODE_TYPES = new Set(["snippet", "command"]);

interface EditFormState {
  title: string;
  description: string;
  content: string;
  url: string;
  language: string;
  tags: string;
}

function toEditFormState(item: ItemDetail): EditFormState {
  return {
    title: item.title,
    description: item.description ?? "",
    content: item.content ?? "",
    url: item.url ?? "",
    language: item.language ?? "",
    tags: item.tags.join(", "),
  };
}

interface ItemDrawerProps {
  itemId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ItemDrawer({ itemId, open, onOpenChange }: ItemDrawerProps) {
  const router = useRouter();
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loadedItemId, setLoadedItemId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editingForItemId, setEditingForItemId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (isEditing && editingForItemId !== itemId) {
    setIsEditing(false);
    setEditForm(null);
  }

  useEffect(() => {
    if (!open || !itemId) return;

    let cancelled = false;

    fetch(`/api/items/${itemId}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((json) => {
        if (cancelled) return;
        setItem(json.data);
        setLoadedItemId(itemId);
      })
      .catch(() => {
        if (!cancelled) {
          setItem(null);
          setLoadedItemId(itemId);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, itemId]);

  const loading = itemId !== null && loadedItemId !== itemId;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setIsEditing(false);
      setEditForm(null);
    }
    onOpenChange(nextOpen);
  }

  const Icon = item ? ITEM_TYPE_ICONS[item.itemType.name] : undefined;
  const label = item ? (ITEM_TYPE_LABELS[item.itemType.name] ?? item.itemType.name).replace(/s$/, "") : "";

  function handleStartEdit() {
    if (!item) return;
    setEditForm(toEditFormState(item));
    setEditingForItemId(itemId);
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setIsEditing(false);
    setEditForm(null);
  }

  async function handleSaveEdit() {
    if (!item || !editForm) return;

    const trimmedTitle = editForm.title.trim();
    if (!trimmedTitle) return;

    setIsSaving(true);

    const result = await updateItem(item.id, {
      title: trimmedTitle,
      description: editForm.description.trim() || null,
      content: editForm.content.trim() || null,
      url: editForm.url.trim() || null,
      language: editForm.language.trim() || null,
      tags: editForm.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });

    setIsSaving(false);

    if (!result.success || !result.data) {
      toast.error(result.error ?? "Failed to update item");
      return;
    }

    setItem(result.data);
    setIsEditing(false);
    setEditForm(null);
    toast.success("Item updated");
    router.refresh();
  }

  async function handleDelete() {
    if (!item) return;

    setIsDeleting(true);

    const result = await deleteItem(item.id);

    setIsDeleting(false);

    if (!result.success) {
      toast.error(result.error ?? "Failed to delete item");
      return;
    }

    toast.success("Item deleted");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        className="w-full min-w-0 data-[side=right]:sm:max-w-xl"
        side="right"
      >
        {loading || !item ? (
          <ItemDrawerSkeleton />
        ) : (
          <>
            <SheetHeader className="gap-1 pr-10">
              <div
                className="flex items-center gap-1.5 text-xs font-medium"
                style={{ color: item.itemType.color }}
              >
                {Icon && <Icon className="size-3.5" />}
                {label}
              </div>
              <SheetTitle className="text-lg">{item.title}</SheetTitle>
            </SheetHeader>

            {isEditing ? (
              <div className="flex items-center gap-1 border-b px-4 pb-4">
                <Button size="sm" onClick={handleSaveEdit} disabled={isSaving || !editForm?.title.trim()}>
                  {isSaving ? "Saving…" : "Save"}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleCancelEdit} disabled={isSaving}>
                  <X />
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-1 overflow-x-auto border-b px-4 pb-4 sm:flex-nowrap">
                <Button variant="ghost" size="sm">
                  <Copy />
                  Copy
                </Button>
                <Button variant="ghost" size="sm" onClick={handleStartEdit}>
                  <Pencil />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={item.isFavorite ? "text-yellow-500" : undefined}
                >
                  <Star className={item.isFavorite ? "fill-yellow-500" : undefined} />
                  Favorite
                </Button>
                <Button variant="ghost" size="sm">
                  <Pin />
                  Pin
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger
                    render={<Button variant="ghost" size="sm" className="ml-auto text-destructive" />}
                  >
                    <Trash2 />
                    Delete
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete item</AlertDialogTitle>
                      <AlertDialogDescription>
                        This permanently deletes &ldquo;{item.title}&rdquo;. This action cannot be
                        undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        disabled={isDeleting}
                        onClick={handleDelete}
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}

            {isEditing && editForm ? (
              <div className="flex min-w-0 flex-col gap-4 overflow-y-auto px-4 pb-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  />
                </div>

                {TEXT_CONTENT_TYPES.has(item.itemType.name) && (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="edit-content">Content</Label>
                    {CODE_TYPES.has(item.itemType.name) ? (
                      <CodeEditor
                        value={editForm.content}
                        onChange={(value) => setEditForm({ ...editForm, content: value })}
                        language={editForm.language}
                      />
                    ) : (
                      <Textarea
                        id="edit-content"
                        className="min-h-32 font-mono text-xs"
                        value={editForm.content}
                        onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                      />
                    )}
                  </div>
                )}

                {LANGUAGE_TYPES.has(item.itemType.name) && (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="edit-language">Language</Label>
                    <Input
                      id="edit-language"
                      value={editForm.language}
                      onChange={(e) => setEditForm({ ...editForm, language: e.target.value })}
                    />
                  </div>
                )}

                {item.itemType.name === "link" && (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="edit-url">URL</Label>
                    <Input
                      id="edit-url"
                      value={editForm.url}
                      onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-tags">Tags</Label>
                  <Input
                    id="edit-tags"
                    placeholder="Comma-separated"
                    value={editForm.tags}
                    onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                  />
                </div>

                {item.collections.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Collections
                    </h3>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {item.collections.map((collection) => (
                        <Badge key={collection.id} variant="outline">
                          {collection.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
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
                    {CODE_TYPES.has(item.itemType.name) ? (
                      <div className="mt-1.5">
                        <CodeEditor value={item.content} language={item.language} readOnly />
                      </div>
                    ) : (
                      <pre className="mt-1.5 min-w-0 overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs">
                        <code>{item.content}</code>
                      </pre>
                    )}
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
                  <div>
                    <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      File
                    </h3>
                    <p className="mt-1.5 text-sm">{item.fileName}</p>
                  </div>
                )}

                {item.tags.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Tags
                    </h3>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {item.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-muted-foreground">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {item.collections.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Collections
                    </h3>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {item.collections.map((collection) => (
                        <Badge key={collection.id} variant="outline">
                          {collection.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-auto border-t p-4 text-xs text-muted-foreground">
              Last updated {formatRelativeTime(item.updatedAt)}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ItemDrawerSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-3/4" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-14" />
      </div>
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

function formatRelativeTime(date: string | Date): string {
  const then = new Date(date).getTime();
  const diffMs = Date.now() - then;
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;

  return new Date(date).toLocaleDateString();
}
