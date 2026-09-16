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
import { Label } from "@/components/ui/label";
import { createCollection, updateCollection } from "@/actions/collections";

interface FormState {
  name: string;
  description: string;
}

function toFormState(collection?: { name: string; description: string | null }): FormState {
  return {
    name: collection?.name ?? "",
    description: collection?.description ?? "",
  };
}

interface CollectionFormDialogProps {
  mode: "create" | "edit";
  collection?: { id: string; name: string; description: string | null };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CollectionFormDialog({
  mode,
  collection,
  open,
  onOpenChange,
}: CollectionFormDialogProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => toFormState(collection));
  const [isSaving, setIsSaving] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    setForm(toFormState(collection));
    onOpenChange(nextOpen);
  }

  async function handleSubmit() {
    const trimmedName = form.name.trim();
    if (!trimmedName) return;

    setIsSaving(true);

    const result =
      mode === "create"
        ? await createCollection({
            name: trimmedName,
            description: form.description.trim() || undefined,
          })
        : await updateCollection(collection!.id, {
            name: trimmedName,
            description: form.description.trim() || undefined,
          });

    setIsSaving(false);

    if (!result.success) {
      toast.error(result.error ?? `Failed to ${mode === "create" ? "create" : "update"} collection`);
      return;
    }

    toast.success(mode === "create" ? "Collection created" : "Collection updated");
    handleOpenChange(false);
    router.refresh();
  }

  const idPrefix = mode === "create" ? "create-collection" : "edit-collection";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New collection" : "Edit collection"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Group related items together."
              : "Update this collection's name and description."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${idPrefix}-name`}>Name</Label>
            <Input
              id={`${idPrefix}-name`}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${idPrefix}-description`}>Description</Label>
            <Textarea
              id={`${idPrefix}-description`}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving || !form.name.trim()}>
            {isSaving
              ? mode === "create"
                ? "Creating…"
                : "Saving…"
              : mode === "create"
                ? "Create"
                : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
