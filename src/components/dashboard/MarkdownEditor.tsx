"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { EditorTabButton } from "@/components/dashboard/EditorTabButton";
import { AiActionButton } from "@/components/dashboard/AiActionButton";
import { optimizePrompt } from "@/actions/ai";

const MAX_HEIGHT = 400;
const MIN_HEIGHT = 100;

type MarkdownTab = "write" | "preview" | "optimized";

interface MarkdownEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  className?: string;
  /** Item title, used to build the Optimize prompt. Passing this together with enableOptimize shows the Optimize button. */
  title?: string;
  isPro?: boolean;
  /** Shows the Optimize button. Scoped to prompt items only — not note, which shares this editor. */
  enableOptimize?: boolean;
}

export function MarkdownEditor({
  value,
  onChange,
  readOnly = false,
  className,
  title,
  isPro = false,
  enableOptimize = false,
}: MarkdownEditorProps) {
  const [tab, setTab] = useState<MarkdownTab>(readOnly ? "preview" : "write");
  const { copied, copy } = useCopyToClipboard();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedPrompt, setOptimizedPrompt] = useState<string | null>(null);

  const canOptimize = enableOptimize && !readOnly && Boolean(title);

  async function handleOptimize() {
    if (!isPro) {
      toast.error("AI features require Pro subscription");
      return;
    }

    if (optimizedPrompt !== null) {
      setTab("optimized");
      return;
    }

    setIsOptimizing(true);
    const result = await optimizePrompt({ title: title ?? "", content: value });
    setIsOptimizing(false);

    if (!result.success) {
      toast.error(result.error ?? "AI prompt optimization failed. Please try again.");
      return;
    }

    setOptimizedPrompt(result.data?.optimizedPrompt ?? "");
    setTab("optimized");
  }

  function handleUseOptimized() {
    if (optimizedPrompt) {
      onChange?.(optimizedPrompt);
    }
    setOptimizedPrompt(null);
    setTab("write");
  }

  function handleDiscardOptimized() {
    setOptimizedPrompt(null);
    setTab("write");
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-[#1e1e1e]",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-white/10 bg-[#2d2d2d] px-3 py-2">
        {readOnly ? (
          <span className="text-xs font-medium text-white/70">Preview</span>
        ) : (
          <div className="flex items-center gap-1">
            <EditorTabButton active={tab === "write"} onClick={() => setTab("write")}>
              Write
            </EditorTabButton>
            <EditorTabButton active={tab === "preview"} onClick={() => setTab("preview")}>
              Preview
            </EditorTabButton>
            {optimizedPrompt !== null && (
              <EditorTabButton active={tab === "optimized"} onClick={() => setTab("optimized")}>
                Optimized
              </EditorTabButton>
            )}
          </div>
        )}
        <div className="flex items-center gap-2">
          {canOptimize && (
            <AiActionButton isPro={isPro} isLoading={isOptimizing} onClick={handleOptimize} />
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="text-white/60 hover:bg-white/10 hover:text-white"
            onClick={() => copy(value)}
          >
            {copied ? <Check className="text-emerald-400" /> : <Copy />}
          </Button>
        </div>
      </div>
      <div
        style={{ maxHeight: MAX_HEIGHT, minHeight: MIN_HEIGHT }}
        className="overflow-y-auto"
      >
        {tab === "optimized" && optimizedPrompt !== null ? (
          <div className="flex h-full flex-col">
            <div className="markdown-preview flex-1 overflow-y-auto p-3">
              {optimizedPrompt ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{optimizedPrompt}</ReactMarkdown>
              ) : (
                <p className="text-xs text-white/30">
                  Your prompt already looks well-optimized — no changes suggested.
                </p>
              )}
            </div>
            {optimizedPrompt && (
              <div className="flex items-center justify-end gap-2 border-t border-white/10 p-2">
                <Button type="button" variant="ghost" size="sm" onClick={handleDiscardOptimized}>
                  Discard
                </Button>
                <Button type="button" size="sm" onClick={handleUseOptimized}>
                  Use this prompt
                </Button>
              </div>
            )}
          </div>
        ) : tab === "write" && !readOnly ? (
          <textarea
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder="Write markdown…"
            style={{ minHeight: MIN_HEIGHT }}
            className="w-full resize-none bg-transparent p-3 font-mono text-xs text-white/90 outline-none placeholder:text-white/30"
          />
        ) : (
          <div className="markdown-preview p-3">
            {value ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
            ) : (
              <p className="text-xs text-white/30">Nothing to preview.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
