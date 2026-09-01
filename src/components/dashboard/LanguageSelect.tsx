import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LANGUAGE_OPTIONS } from "@/lib/constants/item-types";

interface LanguageSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
}

export function LanguageSelect({ id, value, onChange }: LanguageSelectProps) {
  const normalized = value.trim().toLowerCase();
  const isKnown = LANGUAGE_OPTIONS.some((option) => option.value === normalized);
  const options =
    normalized && !isKnown
      ? [...LANGUAGE_OPTIONS, { value: normalized, label: value.trim() }]
      : LANGUAGE_OPTIONS;

  return (
    <Select value={normalized} onValueChange={(value) => onChange(value ?? "")}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder="Select a language" />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
