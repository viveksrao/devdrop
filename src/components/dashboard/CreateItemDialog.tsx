"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ItemContentField } from "@/components/dashboard/ItemContentField";
import { FileUpload, type UploadedFile } from "@/components/dashboard/FileUpload";
import { CollectionPicker } from "@/components/dashboard/CollectionPicker";
import { LanguageSelect } from "@/components/dashboard/LanguageSelect";
import { TagSuggestions } from "@/components/dashboard/TagSuggestions";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  ITEM_TYPE_ICONS,
  ITEM_TYPE_LABELS,
  TEXT_CONTENT_TYPES,
  LANGUAGE_TYPES,
  FILE_TYPES,
  PRO_ONLY_TYPES,
} from "@/lib/constants/item-types";
import { createItem } from "@/actions/items";
import type { CollectionOption } from "@/lib/db/collections";

const CREATABLE_TYPES = [
  "snippet",
  "prompt",
  "command",
  "note",
  "link",
  "file",
  "image",
] as const;
type CreatableType = (typeof CREATABLE_TYPES)[number];

interface FormState {
  title: string;
  description: string;
  content: string;
  url: string;
  language: string;
  tags: string;
}

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  content: "",
  url: "",
  language: "",
  tags: "",
};

interface CreateItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collections: CollectionOption[];
}

export function CreateItemDialog({ open, onOpenChange, collections }: CreateItemDialogProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const isPro = session?.user?.isPro ?? false;
  const [itemTypeName, setItemTypeName] = useState<CreatableType>("snippet");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [collectionIds, setCollectionIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  function handleAcceptTag(tag: string) {
    const currentTags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (currentTags.includes(tag)) return;
    setForm({ ...form, tags: [...currentTags, tag].join(", ") });
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setItemTypeName("snippet");
      setForm(EMPTY_FORM);
      setFile(null);
      setCollectionIds([]);
    }
    onOpenChange(nextOpen);
  }

  async function handleCreate() {
    const trimmedTitle = form.title.trim();
    if (!trimmedTitle) return;
    if (FILE_TYPES.has(itemTypeName) && !file) return;

    setIsSaving(true);

    const result = await createItem({
      itemTypeName,
      title: trimmedTitle,
      description: form.description.trim() || undefined,
      content: form.content.trim() || undefined,
      url: form.url.trim() || undefined,
      language: form.language.trim() || undefined,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      fileUrl: file?.fileUrl,
      fileName: file?.fileName,
      fileSize: file?.fileSize,
      collectionIds,
    });

    setIsSaving(false);

    if (!result.success) {
      toast.error(result.error ?? "Failed to create item");
      return;
    }

    toast.success("Item created");
    handleOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New item</DialogTitle>
          <DialogDescription>
            Add a snippet, prompt, command, note, link, file, or image.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Type</Label>
            <div className="flex flex-wrap gap-1.5">
              {CREATABLE_TYPES.map((type) => {
                const Icon = ITEM_TYPE_ICONS[type];
                const label = (ITEM_TYPE_LABELS[type] ?? type).replace(/s$/, "");
                const selected = itemTypeName === type;
                const locked = PRO_ONLY_TYPES.has(type) && !isPro;
                return (
                  <button
                    key={type}
                    type="button"
                    disabled={locked}
                    onClick={() => setItemTypeName(type)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm transition-colors",
                      selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground",
                      locked && "cursor-not-allowed opacity-50 hover:text-muted-foreground"
                    )}
                  >
                    <Icon className="size-3.5" />
                    {label}
                    {locked && (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        PRO
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="create-title">Title</Label>
            <Input
              id="create-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="create-description">Description</Label>
            <Textarea
              id="create-description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {LANGUAGE_TYPES.has(itemTypeName) && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="create-language">Language</Label>
              <LanguageSelect
                id="create-language"
                value={form.language}
                onChange={(value) => setForm({ ...form, language: value })}
              />
            </div>
          )}

          {TEXT_CONTENT_TYPES.has(itemTypeName) && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="create-content">Content</Label>
              <ItemContentField
                id="create-content"
                itemTypeName={itemTypeName}
                value={form.content}
                onChange={(value) => setForm({ ...form, content: value })}
                language={form.language}
              />
            </div>
          )}

          {itemTypeName === "link" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="create-url">URL</Label>
              <Input
                id="create-url"
                placeholder="https://"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
              />
            </div>
          )}

          {FILE_TYPES.has(itemTypeName) && (
            <div className="flex flex-col gap-1.5">
              <Label>{itemTypeName === "image" ? "Image" : "File"}</Label>
              <FileUpload
                itemTypeName={itemTypeName as "file" | "image"}
                value={file}
                onChange={setFile}
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="create-tags">Tags</Label>
            <Input
              id="create-tags"
              placeholder="Comma-separated"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />
            {isPro && (
              <TagSuggestions
                title={form.title}
                content={form.content}
                existingTags={form.tags
                  .split(",")
                  .map((t) => t.trim().toLowerCase())
                  .filter(Boolean)}
                onAccept={handleAcceptTag}
              />
            )}
          </div>

          <CollectionPicker
            collections={collections}
            selectedIds={collectionIds}
            onChange={setCollectionIds}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={
              isSaving ||
              !form.title.trim() ||
              (itemTypeName === "link" && !form.url.trim()) ||
              (FILE_TYPES.has(itemTypeName) && !file)
            }
          >
            {isSaving ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
