import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ItemContentField } from "@/components/dashboard/ItemContentField";
import { TagBadgeList } from "@/components/dashboard/TagBadgeList";
import { TEXT_CONTENT_TYPES, LANGUAGE_TYPES } from "@/lib/constants/item-types";
import type { ItemDetail } from "@/lib/db/items";

export interface ItemEditFormState {
  title: string;
  description: string;
  content: string;
  url: string;
  language: string;
  tags: string;
}

interface ItemEditFormProps {
  itemType: ItemDetail["itemType"];
  collections: ItemDetail["collections"];
  form: ItemEditFormState;
  onChange: (form: ItemEditFormState) => void;
}

export function ItemEditForm({ itemType, collections, form, onChange }: ItemEditFormProps) {
  return (
    <div className="flex min-w-0 flex-col gap-4 overflow-y-auto px-4 pb-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-title">Title</Label>
        <Input
          id="edit-title"
          value={form.title}
          onChange={(e) => onChange({ ...form, title: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-description">Description</Label>
        <Textarea
          id="edit-description"
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
        />
      </div>

      {TEXT_CONTENT_TYPES.has(itemType.name) && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-content">Content</Label>
          <ItemContentField
            id="edit-content"
            itemTypeName={itemType.name}
            value={form.content}
            onChange={(value) => onChange({ ...form, content: value })}
            language={form.language}
          />
        </div>
      )}

      {LANGUAGE_TYPES.has(itemType.name) && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-language">Language</Label>
          <Input
            id="edit-language"
            value={form.language}
            onChange={(e) => onChange({ ...form, language: e.target.value })}
          />
        </div>
      )}

      {itemType.name === "link" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-url">URL</Label>
          <Input
            id="edit-url"
            value={form.url}
            onChange={(e) => onChange({ ...form, url: e.target.value })}
          />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-tags">Tags</Label>
        <Input
          id="edit-tags"
          placeholder="Comma-separated"
          value={form.tags}
          onChange={(e) => onChange({ ...form, tags: e.target.value })}
        />
      </div>

      <TagBadgeList
        label="Collections"
        items={collections.map((collection) => collection.name)}
        variant="outline"
      />
    </div>
  );
}
