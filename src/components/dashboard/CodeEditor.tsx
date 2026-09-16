"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { BeforeMount, OnMount } from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEditorPreferences } from "@/components/dashboard/EditorPreferencesProvider";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { EditorTabButton } from "@/components/dashboard/EditorTabButton";
import { AiActionButton } from "@/components/dashboard/AiActionButton";
import { explainCode } from "@/actions/ai";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <div className="h-32 animate-pulse bg-[#1e1e1e]" />,
});

function defineMonacoThemes(monaco: Parameters<BeforeMount>[0]) {
  monaco.editor.defineTheme("monokai", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "75715e" },
      { token: "string", foreground: "e6db74" },
      { token: "keyword", foreground: "f92672" },
      { token: "number", foreground: "ae81ff" },
      { token: "type", foreground: "66d9ef", fontStyle: "italic" },
      { token: "function", foreground: "a6e22e" },
    ],
    colors: {
      "editor.background": "#272822",
      "editor.foreground": "#f8f8f2",
      "editorLineNumber.foreground": "#75715e",
      "editorCursor.foreground": "#f8f8f0",
      "editor.selectionBackground": "#49483e",
    },
  });

  monaco.editor.defineTheme("github-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "8b949e" },
      { token: "string", foreground: "a5d6ff" },
      { token: "keyword", foreground: "ff7b72" },
      { token: "number", foreground: "79c0ff" },
      { token: "type", foreground: "ffa657" },
      { token: "function", foreground: "d2a8ff" },
    ],
    colors: {
      "editor.background": "#0d1117",
      "editor.foreground": "#c9d1d9",
      "editorLineNumber.foreground": "#6e7681",
      "editorCursor.foreground": "#c9d1d9",
      "editor.selectionBackground": "#3392ff44",
    },
  });
}

const MAX_HEIGHT = 400;
const MIN_HEIGHT = 100;

type CodeEditorTab = "code" | "explain";

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string | null;
  readOnly?: boolean;
  className?: string;
  /** Item title, used to build the Explain prompt. Passing this (read-only view only) enables the Explain feature. */
  title?: string;
  isPro?: boolean;
}

export function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
  className,
  title,
  isPro = false,
}: CodeEditorProps) {
  const [height, setHeight] = useState(MIN_HEIGHT);
  const { copied, copy } = useCopyToClipboard();
  const [tab, setTab] = useState<CodeEditorTab>("code");
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const { preferences } = useEditorPreferences();

  const canExplain = Boolean(title);

  function handleMount(...[editor]: Parameters<OnMount>) {
    const updateHeight = () => {
      const contentHeight = editor.getContentHeight();
      setHeight(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, contentHeight)));
    };
    editor.onDidContentSizeChange(updateHeight);
    updateHeight();
  }

  async function handleExplain() {
    if (!isPro) {
      toast.error("AI features require Pro subscription");
      return;
    }

    if (explanation !== null) {
      setTab("explain");
      return;
    }

    setIsExplaining(true);
    const result = await explainCode({
      title: title ?? "",
      content: value,
      language: language ?? undefined,
    });
    setIsExplaining(false);

    if (!result.success) {
      toast.error(result.error ?? "AI explanation failed. Please try again.");
      return;
    }

    setExplanation(result.data?.explanation ?? "");
    setTab("explain");
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-[#1e1e1e]",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-white/10 bg-[#2a2a2a] px-3 py-2">
        {canExplain ? (
          <div className="flex items-center gap-1">
            <EditorTabButton active={tab === "code"} onClick={() => setTab("code")}>
              Code
            </EditorTabButton>
            {explanation !== null && (
              <EditorTabButton active={tab === "explain"} onClick={() => setTab("explain")}>
                Explain
              </EditorTabButton>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#ff5f56]" />
            <span className="size-2.5 rounded-full bg-[#ffbd2e]" />
            <span className="size-2.5 rounded-full bg-[#27c93f]" />
          </div>
        )}
        <div className="flex items-center gap-2">
          {language && (
            <span className="text-xs text-white/50">{language}</span>
          )}
          {canExplain && (
            <AiActionButton isPro={isPro} isLoading={isExplaining} onClick={handleExplain} />
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
      {tab === "explain" && explanation !== null ? (
        <div
          style={{ maxHeight: MAX_HEIGHT, minHeight: MIN_HEIGHT }}
          className="markdown-preview overflow-y-auto p-3"
        >
          {explanation ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{explanation}</ReactMarkdown>
          ) : (
            <p className="text-xs text-white/30">Couldn&apos;t generate an explanation.</p>
          )}
        </div>
      ) : (
        <Editor
          height={height}
          language={monacoLanguage(language)}
          value={value}
          onChange={(v) => onChange?.(v ?? "")}
          onMount={handleMount}
          beforeMount={defineMonacoThemes}
          theme={preferences.theme}
          options={{
            readOnly,
            domReadOnly: readOnly,
            minimap: { enabled: preferences.minimap },
            fontSize: preferences.fontSize,
            tabSize: preferences.tabSize,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: preferences.wordWrap ? "on" : "off",
            padding: { top: 12, bottom: 12 },
            scrollbar: {
              vertical: "auto",
              horizontal: "auto",
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
              useShadows: false,
            },
            renderLineHighlight: readOnly ? "none" : "line",
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            overviewRulerBorder: false,
          }}
          loading={<div className="h-full bg-[#1e1e1e]" />}
        />
      )}
    </div>
  );
}

const MONACO_LANGUAGE_MAP: Record<string, string> = {
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  py: "python",
  rb: "ruby",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  yml: "yaml",
  md: "markdown",
};

function monacoLanguage(language?: string | null): string {
  if (!language) return "plaintext";
  const normalized = language.trim().toLowerCase();
  return MONACO_LANGUAGE_MAP[normalized] ?? normalized;
}
