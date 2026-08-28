import { Search, LayoutGrid, type LucideIcon } from "lucide-react";
import { ITEM_TYPE_ICONS } from "@/lib/constants/item-types";
import { ScrollFadeIn } from "@/components/marketing/ScrollFadeIn";

interface Feature {
  icon: LucideIcon;
  accent: string;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: ITEM_TYPE_ICONS.snippet,
    accent: "#3b82f6",
    title: "Code Snippets",
    description: "Save and organize reusable code with syntax highlighting for any language.",
  },
  {
    icon: ITEM_TYPE_ICONS.prompt,
    accent: "#8b5cf6",
    title: "AI Prompts",
    description: "Keep your best prompts, contexts, and system messages ready to reuse.",
  },
  {
    icon: Search,
    accent: "#f59e0b",
    title: "Instant Search",
    description: "Find anything in seconds — search across content, tags, titles, and types.",
  },
  {
    icon: ITEM_TYPE_ICONS.command,
    accent: "#f97316",
    title: "Commands",
    description: "Stop digging through bash history — store the commands you actually reuse.",
  },
  {
    icon: ITEM_TYPE_ICONS.file,
    accent: "#6b7280",
    title: "Files & Docs",
    description: "Upload files and images so your reference material lives right alongside your notes.",
  },
  {
    icon: LayoutGrid,
    accent: "#10b981",
    title: "Collections",
    description: "Group snippets, notes, and links into collections for any project or topic.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="px-6 py-24">
      <ScrollFadeIn className="mx-auto mb-14 max-w-xl text-center">
        <span className="mb-3 inline-block text-xs font-semibold tracking-[0.08em] text-blue-500 uppercase">
          Features
        </span>
        <h2 className="mb-3 text-[clamp(1.8rem,3.5vw,2.4rem)] font-extrabold tracking-tight text-white">
          Everything in one place
        </h2>
        <p className="text-[1.05rem] text-marketing-text-muted">
          One hub for every type of knowledge you collect as a developer.
        </p>
      </ScrollFadeIn>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <ScrollFadeIn key={feature.title}>
            <div
              className="group h-full rounded-2xl border border-marketing-border bg-marketing-bg-elevated p-7 transition-all duration-200 hover:-translate-y-1"
              style={
                {
                  "--accent": feature.accent,
                } as React.CSSProperties
              }
            >
              <div
                className="mb-4.5 flex h-11 w-11 items-center justify-center rounded-[10px]"
                style={{ background: `color-mix(in srgb, ${feature.accent} 15%, transparent)`, color: feature.accent }}
              >
                <feature.icon className="h-5.5 w-5.5" />
              </div>
              <h3 className="mb-2 text-base font-bold text-white">{feature.title}</h3>
              <p className="text-sm text-marketing-text-muted">{feature.description}</p>
            </div>
          </ScrollFadeIn>
        ))}
      </div>
    </section>
  );
}
