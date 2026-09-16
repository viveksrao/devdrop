import { CollectionFormDialog } from "@/components/dashboard/CollectionFormDialog";

interface CreateCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCollectionDialog({ open, onOpenChange }: CreateCollectionDialogProps) {
  return <CollectionFormDialog mode="create" open={open} onOpenChange={onOpenChange} />;
}
