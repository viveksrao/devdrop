import { CollectionFormDialog } from "@/components/dashboard/CollectionFormDialog";

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
  return (
    <CollectionFormDialog
      mode="edit"
      collection={collection}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}
