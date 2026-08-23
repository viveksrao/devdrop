import { Textarea } from "@/components/ui/textarea";
import { CodeEditor } from "@/components/dashboard/CodeEditor";
import { MarkdownEditor } from "@/components/dashboard/MarkdownEditor";
import { CODE_TYPES, MARKDOWN_TYPES } from "@/lib/constants/item-types";

interface ItemContentFieldProps {
  itemTypeName: string;
  value: string;
  onChange?: (value: string) => void;
  language?: string | null;
  readOnly?: boolean;
  id?: string;
}

export function ItemContentField({
  itemTypeName,
  value,
  onChange,
  language,
  readOnly = false,
  id,
}: ItemContentFieldProps) {
  if (CODE_TYPES.has(itemTypeName)) {
    return <CodeEditor value={value} onChange={onChange} language={language} readOnly={readOnly} />;
  }

  if (MARKDOWN_TYPES.has(itemTypeName)) {
    return <MarkdownEditor value={value} onChange={onChange} readOnly={readOnly} />;
  }

  if (readOnly) {
    return (
      <pre className="mt-1.5 min-w-0 overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs">
        <code>{value}</code>
      </pre>
    );
  }

  return (
    <Textarea
      id={id}
      className="min-h-32 font-mono text-xs"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  );
}
