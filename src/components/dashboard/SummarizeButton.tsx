"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { summarizeItem } from "@/actions/ai";

interface SummarizeButtonProps {
  title: string;
  content: string;
  url?: string;
  onSummary: (summary: string) => void;
}

export function SummarizeButton({ title, content, url, onSummary }: SummarizeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSummarize() {
    if (!title.trim()) {
      toast.error("Add a title before summarizing");
      return;
    }

    setIsLoading(true);
    const result = await summarizeItem({
      title,
      content: content || undefined,
      url: url || undefined,
    });
    setIsLoading(false);

    if (!result.success) {
      toast.error(result.error ?? "AI summary failed. Please try again.");
      return;
    }

    if (!result.data?.summary) {
      toast.error("Couldn't generate a summary");
      return;
    }

    onSummary(result.data.summary);
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="w-fit text-muted-foreground"
      onClick={handleSummarize}
      disabled={isLoading}
    >
      <Sparkles className="size-3.5" />
      {isLoading ? "Summarizing…" : "Summarize"}
    </Button>
  );
}
