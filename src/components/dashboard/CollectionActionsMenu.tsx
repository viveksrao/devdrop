"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EditCollectionDialog } from "@/components/dashboard/EditCollectionDialog";
import { deleteCollection, toggleCollectionFavorite } from "@/actions/collections";

export interface CollectionActionsTarget {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
}

export function useCollectionActions(collection: CollectionActionsTarget) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    const result = await deleteCollection(collection.id);
    setIsDeleting(false);

    if (!result.success) {
      toast.error(result.error ?? "Failed to delete collection");
      return;
    }

    toast.success("Collection deleted");
    setDeleteOpen(false);
    router.push("/collections");
    router.refresh();
  }

  async function handleToggleFavorite() {
    if (isTogglingFavorite) return;

    setIsTogglingFavorite(true);
    const result = await toggleCollectionFavorite(collection.id);
    setIsTogglingFavorite(false);

    if (!result.success) {
      toast.error(result.error ?? "Failed to update favorite");
      return;
    }

    router.refresh();
  }

  const dialogs = (
    <>
      <EditCollectionDialog collection={collection} open={editOpen} onOpenChange={setEditOpen} />
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete collection</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes &ldquo;{collection.name}&rdquo;. Items in this collection will not be
              deleted — they will just no longer belong to this collection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={isDeleting} onClick={handleDelete}>
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  return {
    dialogs,
    openEdit: () => setEditOpen(true),
    openDelete: () => setDeleteOpen(true),
    toggleFavorite: handleToggleFavorite,
    isTogglingFavorite,
  };
}
