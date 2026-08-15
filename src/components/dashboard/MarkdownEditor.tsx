"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_HEIGHT = 400;
const MIN_HEIGHT = 100;

type MarkdownTab = "write" | "preview";

interface MarkdownEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  className?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  readOnly = false,
  className,
}: MarkdownEditorProps) {
  const [tab, setTab] = useState<MarkdownTab>(readOnly ? "preview" : "write");
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
            <TabButton active={tab === "write"} onClick={() => setTab("write")}>
              Write
            </TabButton>
            <TabButton active={tab === "preview"} onClick={() => setTab("preview")}>
              Preview
            </TabButton>
          </div>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="text-white/60 hover:bg-white/10 hover:text-white"
          onClick={handleCopy}
        >
          {copied ? <Check className="text-emerald-400" /> : <Copy />}
        </Button>
      </div>
      <div
        style={{ maxHeight: MAX_HEIGHT, minHeight: MIN_HEIGHT }}
        className="overflow-y-auto"
      >
        {tab === "write" && !readOnly ? (
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

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-2 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-white/10 text-white"
          : "text-white/50 hover:text-white/80"
      )}
    >
      {children}
    </button>
  );
}
