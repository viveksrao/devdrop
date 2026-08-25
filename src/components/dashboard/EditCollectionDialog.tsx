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
import { updateCollection } from "@/actions/collections";

interface FormState {
  name: string;
  description: string;
}

interface EditCollectionDialogProps {
  collection: { id: string; name: string; description: string | null };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCollectionDialog({
  collection,
  open,
  onOpenChange,
}: EditCollectionDialogProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    name: collection.name,
    description: collection.description ?? "",
  });
  const [isSaving, setIsSaving] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setForm({ name: collection.name, description: collection.description ?? "" });
    }
    onOpenChange(nextOpen);
  }

  async function handleSave() {
    const trimmedName = form.name.trim();
    if (!trimmedName) return;

    setIsSaving(true);

    const result = await updateCollection(collection.id, {
      name: trimmedName,
      description: form.description.trim() || undefined,
    });

    setIsSaving(false);

    if (!result.success) {
      toast.error(result.error ?? "Failed to update collection");
      return;
    }

    toast.success("Collection updated");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit collection</DialogTitle>
          <DialogDescription>Update this collection&apos;s name and description.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-collection-name">Name</Label>
            <Input
              id="edit-collection-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-collection-description">Description</Label>
            <Textarea
              id="edit-collection-description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !form.name.trim()}>
            {isSaving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
