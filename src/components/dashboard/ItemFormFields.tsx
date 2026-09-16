import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ItemContentField } from "@/components/dashboard/ItemContentField";
import { CollectionPicker } from "@/components/dashboard/CollectionPicker";
import { LanguageSelect } from "@/components/dashboard/LanguageSelect";
import { TagSuggestions } from "@/components/dashboard/TagSuggestions";
import { SummarizeButton } from "@/components/dashboard/SummarizeButton";
import { TEXT_CONTENT_TYPES, LANGUAGE_TYPES } from "@/lib/constants/item-types";
import type { CollectionOption } from "@/lib/db/collections";

export interface ItemFormFieldsValue {
  title: string;
  description: string;
  content: string;
  url: string;
  language: string;
  tags: string;
}

interface ItemFormFieldsProps {
  /** Prefixes element ids so create/edit forms don't collide when both could theoretically mount at once. */
  idPrefix: string;
  itemTypeName: string;
  form: ItemFormFieldsValue;
  onChange: (form: ItemFormFieldsValue) => void;
  isPro: boolean;
  allCollections: CollectionOption[];
  selectedCollectionIds: string[];
  onCollectionIdsChange: (collectionIds: string[]) => void;
  /** Rendered between Content and Tags, e.g. CreateItemDialog's file upload for file/image types. */
  fileSlot?: ReactNode;
}

export function ItemFormFields({
  idPrefix,
  itemTypeName,
  form,
  onChange,
  isPro,
  allCollections,
  selectedCollectionIds,
  onCollectionIdsChange,
  fileSlot,
}: ItemFormFieldsProps) {
  function handleAcceptTag(tag: string) {
    const currentTags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (currentTags.includes(tag)) return;
    onChange({ ...form, tags: [...currentTags, tag].join(", ") });
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-title`}>Title</Label>
        <Input
          id={`${idPrefix}-title`}
          value={form.title}
          onChange={(e) => onChange({ ...form, title: e.target.value })}
          autoFocus={idPrefix === "create"}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-description`}>Description</Label>
        <Textarea
          id={`${idPrefix}-description`}
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
        />
        {isPro && (
          <SummarizeButton
            title={form.title}
            content={form.content}
            url={form.url}
            onSummary={(summary) => onChange({ ...form, description: summary })}
          />
        )}
      </div>

      {LANGUAGE_TYPES.has(itemTypeName) && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-language`}>Language</Label>
          <LanguageSelect
            id={`${idPrefix}-language`}
            value={form.language}
            onChange={(value) => onChange({ ...form, language: value })}
          />
        </div>
      )}

      {TEXT_CONTENT_TYPES.has(itemTypeName) && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-content`}>Content</Label>
          <ItemContentField
            id={`${idPrefix}-content`}
            itemTypeName={itemTypeName}
            value={form.content}
            onChange={(value) => onChange({ ...form, content: value })}
            language={form.language}
            title={form.title}
            isPro={isPro}
          />
        </div>
      )}

      {itemTypeName === "link" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-url`}>URL</Label>
          <Input
            id={`${idPrefix}-url`}
            placeholder="https://"
            value={form.url}
            onChange={(e) => onChange({ ...form, url: e.target.value })}
          />
        </div>
      )}

      {fileSlot}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-tags`}>Tags</Label>
        <Input
          id={`${idPrefix}-tags`}
          placeholder="Comma-separated"
          value={form.tags}
          onChange={(e) => onChange({ ...form, tags: e.target.value })}
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
        collections={allCollections}
        selectedIds={selectedCollectionIds}
        onChange={onCollectionIdsChange}
      />
    </>
  );
}
