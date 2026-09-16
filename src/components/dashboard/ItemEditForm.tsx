import { ItemFormFields } from "@/components/dashboard/ItemFormFields";
import type { ItemDetail } from "@/lib/db/items";
import type { CollectionOption } from "@/lib/db/collections";

export interface ItemEditFormState {
  title: string;
  description: string;
  content: string;
  url: string;
  language: string;
  tags: string;
  collectionIds: string[];
}

interface ItemEditFormProps {
  itemType: ItemDetail["itemType"];
  allCollections: CollectionOption[];
  form: ItemEditFormState;
  onChange: (form: ItemEditFormState) => void;
  isPro: boolean;
}

export function ItemEditForm({
  itemType,
  allCollections,
  form,
  onChange,
  isPro,
}: ItemEditFormProps) {
  return (
    <div className="flex min-w-0 flex-col gap-4 overflow-y-auto px-4 pb-4">
      <ItemFormFields
        idPrefix="edit"
        itemTypeName={itemType.name}
        form={form}
        onChange={(fields) => onChange({ ...form, ...fields })}
        isPro={isPro}
        allCollections={allCollections}
        selectedCollectionIds={form.collectionIds}
        onCollectionIdsChange={(collectionIds) => onChange({ ...form, collectionIds })}
      />
    </div>
  );
}
