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
import { Label } from "@/components/ui/label";
import { ItemTypeSelector } from "@/components/dashboard/ItemTypeSelector";
import { ItemFormFields, type ItemFormFieldsValue } from "@/components/dashboard/ItemFormFields";
import { FileUpload, type UploadedFile } from "@/components/dashboard/FileUpload";
import { FILE_TYPES } from "@/lib/constants/item-types";
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

const EMPTY_FORM: ItemFormFieldsValue = {
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
  const [form, setForm] = useState<ItemFormFieldsValue>(EMPTY_FORM);
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [collectionIds, setCollectionIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

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
          <ItemTypeSelector
            types={CREATABLE_TYPES}
            value={itemTypeName}
            onChange={setItemTypeName}
            isPro={isPro}
          />

          <ItemFormFields
            idPrefix="create"
            itemTypeName={itemTypeName}
            form={form}
            onChange={setForm}
            isPro={isPro}
            allCollections={collections}
            selectedCollectionIds={collectionIds}
            onCollectionIdsChange={setCollectionIds}
            fileSlot={
              FILE_TYPES.has(itemTypeName) && (
                <div className="flex flex-col gap-1.5">
                  <Label>{itemTypeName === "image" ? "Image" : "File"}</Label>
                  <FileUpload
                    itemTypeName={itemTypeName as "file" | "image"}
                    value={file}
                    onChange={setFile}
                  />
                </div>
              )
            }
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
