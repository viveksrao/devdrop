"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { CodeEditor } from "@/components/dashboard/CodeEditor";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ITEM_TYPE_ICONS, ITEM_TYPE_LABELS } from "@/lib/constants/item-types";
import { createItem } from "@/actions/items";

const CREATABLE_TYPES = ["snippet", "prompt", "command", "note", "link"] as const;
type CreatableType = (typeof CREATABLE_TYPES)[number];

const TEXT_CONTENT_TYPES = new Set<CreatableType>(["snippet", "prompt", "command", "note"]);
const LANGUAGE_TYPES = new Set<CreatableType>(["snippet", "command"]);
const CODE_TYPES = new Set<CreatableType>(["snippet", "command"]);

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
}

export function CreateItemDialog({ open, onOpenChange }: CreateItemDialogProps) {
  const router = useRouter();
  const [itemTypeName, setItemTypeName] = useState<CreatableType>("snippet");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setItemTypeName("snippet");
      setForm(EMPTY_FORM);
    }
    onOpenChange(nextOpen);
  }

  async function handleCreate() {
    const trimmedTitle = form.title.trim();
    if (!trimmedTitle) return;

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
          <DialogDescription>Add a snippet, prompt, command, note, or link.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Type</Label>
            <div className="flex flex-wrap gap-1.5">
              {CREATABLE_TYPES.map((type) => {
                const Icon = ITEM_TYPE_ICONS[type];
                const label = (ITEM_TYPE_LABELS[type] ?? type).replace(/s$/, "");
                const selected = itemTypeName === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setItemTypeName(type)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm transition-colors",
                      selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="size-3.5" />
                    {label}
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

          {TEXT_CONTENT_TYPES.has(itemTypeName) && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="create-content">Content</Label>
              {CODE_TYPES.has(itemTypeName) ? (
                <CodeEditor
                  value={form.content}
                  onChange={(value) => setForm({ ...form, content: value })}
                  language={form.language}
                />
              ) : (
                <Textarea
                  id="create-content"
                  className="min-h-32 font-mono text-xs"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                />
              )}
            </div>
          )}

          {LANGUAGE_TYPES.has(itemTypeName) && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="create-language">Language</Label>
              <Input
                id="create-language"
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
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

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="create-tags">Tags</Label>
            <Input
              id="create-tags"
              placeholder="Comma-separated"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={
              isSaving || !form.title.trim() || (itemTypeName === "link" && !form.url.trim())
            }
          >
            {isSaving ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
