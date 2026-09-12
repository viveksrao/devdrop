"use client";

import { useState } from "react";
import { Sparkles, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { generateAutoTags } from "@/actions/ai";

interface TagSuggestionsProps {
  title: string;
  content: string;
  existingTags: string[];
  onAccept: (tag: string) => void;
}

export function TagSuggestions({ title, content, existingTags, onAccept }: TagSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSuggest() {
    if (!title.trim()) {
      toast.error("Add a title before suggesting tags");
      return;
    }

    setIsLoading(true);
    const result = await generateAutoTags({ title, content: content || undefined });
    setIsLoading(false);

    if (!result.success) {
      toast.error(result.error ?? "AI suggestion failed. Please try again.");
      return;
    }

    const newSuggestions = (result.data?.tags ?? []).filter(
      (tag) => !existingTags.includes(tag)
    );

    if (newSuggestions.length === 0) {
      toast.error("No new tag suggestions found");
      return;
    }

    setSuggestions(newSuggestions);
  }

  function handleAccept(tag: string) {
    onAccept(tag);
    setSuggestions((prev) => prev.filter((t) => t !== tag));
  }

  function handleReject(tag: string) {
    setSuggestions((prev) => prev.filter((t) => t !== tag));
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-fit text-muted-foreground"
        onClick={handleSuggest}
        disabled={isLoading}
      >
        <Sparkles className="size-3.5" />
        {isLoading ? "Suggesting…" : "Suggest tags"}
      </Button>

      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((tag) => (
            <Badge key={tag} variant="outline" className="gap-1 border-dashed pr-1">
              {tag}
              <button
                type="button"
                onClick={() => handleAccept(tag)}
                className="rounded-full p-0.5 hover:bg-primary/20 hover:text-primary"
                aria-label={`Accept tag ${tag}`}
              >
                <Check className="size-3" />
              </button>
              <button
                type="button"
                onClick={() => handleReject(tag)}
                className="rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive"
                aria-label={`Reject tag ${tag}`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
