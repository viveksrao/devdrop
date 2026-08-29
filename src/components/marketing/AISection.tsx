import { ScrollFadeIn } from "@/components/marketing/ScrollFadeIn";

const CHECKLIST_ITEMS = [
  "AI auto-tag suggestions",
  "AI-generated summaries",
  '"Explain This Code" on demand',
  "AI prompt optimizer",
];

const TAGS = ["react", "hooks", "typescript", "debounce"];

export function AISection() {
  return (
    <section
      className="px-6 py-24"
      style={{
        backgroundImage: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(139,92,246,0.08), transparent)",
      }}
    >
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 md:grid-cols-2">
        <ScrollFadeIn>
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/15 px-3 py-1.5 text-xs font-semibold text-violet-300">
            Pro Feature
          </span>
          <h2 className="mt-4 mb-3 text-[clamp(1.8rem,3.5vw,2.2rem)] font-extrabold tracking-tight text-white">
            Let AI do the tagging
          </h2>
          <p className="mb-7 text-marketing-text-muted">Save time on the busywork so you can get back to building.</p>
          <ul>
            {CHECKLIST_ITEMS.map((item, i) => (
              <li
                key={item}
                className={`flex items-center gap-3 py-2.5 text-[0.95rem] text-white ${
                  i < CHECKLIST_ITEMS.length - 1 ? "border-b border-marketing-border" : ""
                }`}
              >
                <span className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs text-violet-300">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </ScrollFadeIn>

        <ScrollFadeIn>
          <div className="overflow-hidden rounded-2xl border border-marketing-border bg-marketing-bg-card shadow-[0_30px_60px_-20px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-2 border-b border-marketing-border bg-white/[0.03] px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
              <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
              <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
              <span className="ml-2 text-[0.78rem] text-marketing-text-dim">useDebounce.ts</span>
            </div>
            <div className="relative">
              <div className="overflow-x-auto px-5 py-4.5 font-mono text-[0.8rem] leading-[1.7]">
                <pre>
                <code>
                  <span className="text-pink-400">export function</span>{" "}
                  <span className="text-blue-400">useDebounce</span>
                  <span className="text-marketing-text-muted">&lt;</span>
                  <span className="text-emerald-400">T</span>
                  <span className="text-marketing-text-muted">&gt;(</span>
                  <span className="text-zinc-200">value</span>
                  <span className="text-marketing-text-muted">:</span> <span className="text-emerald-400">T</span>
                  <span className="text-marketing-text-muted">,</span> <span className="text-zinc-200">delay</span>
                  <span className="text-marketing-text-muted">:</span>{" "}
                  <span className="text-emerald-400">number</span>
                  <span className="text-marketing-text-muted">{") {"}</span>
                  {"\n  "}
                  <span className="text-pink-400">const</span>{" "}
                  <span className="text-marketing-text-muted">[</span>
                  <span className="text-zinc-200">debounced</span>
                  <span className="text-marketing-text-muted">,</span>{" "}
                  <span className="text-zinc-200">setDebounced</span>
                  <span className="text-marketing-text-muted">] =</span>{" "}
                  <span className="text-blue-400">useState</span>
                  <span className="text-marketing-text-muted">(</span>
                  <span className="text-zinc-200">value</span>
                  <span className="text-marketing-text-muted">);</span>
                  {"\n\n  "}
                  <span className="text-blue-400">useEffect</span>
                  <span className="text-marketing-text-muted">{"(() => {"}</span>
                  {"\n    "}
                  <span className="text-pink-400">const</span> <span className="text-zinc-200">id</span>{" "}
                  <span className="text-marketing-text-muted">=</span>{" "}
                  <span className="text-blue-400">setTimeout</span>
                  <span className="text-marketing-text-muted">{"(() =>"}</span>{" "}
                  <span className="text-blue-400">setDebounced</span>
                  <span className="text-marketing-text-muted">(</span>
                  <span className="text-zinc-200">value</span>
                  <span className="text-marketing-text-muted">),</span> <span className="text-zinc-200">delay</span>
                  <span className="text-marketing-text-muted">);</span>
                  {"\n    "}
                  <span className="text-pink-400">return</span>{" "}
                  <span className="text-marketing-text-muted">{"() =>"}</span>{" "}
                  <span className="text-blue-400">clearTimeout</span>
                  <span className="text-marketing-text-muted">(</span>
                  <span className="text-zinc-200">id</span>
                  <span className="text-marketing-text-muted">);</span>
                  {"\n  "}
                  <span className="text-marketing-text-muted">{"}, ["}</span>
                  <span className="text-zinc-200">value</span>
                  <span className="text-marketing-text-muted">,</span> <span className="text-zinc-200">delay</span>
                  <span className="text-marketing-text-muted">{"]);"}</span>
                  {"\n\n  "}
                  <span className="text-pink-400">return</span> <span className="text-zinc-200">debounced</span>
                  <span className="text-marketing-text-muted">;</span>
                  {"\n"}
                  <span className="text-marketing-text-muted">{"}"}</span>
                </code>
                </pre>
              </div>
              <div
                className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-marketing-bg-card to-transparent"
                aria-hidden="true"
              />
            </div>
            <div className="border-t border-marketing-border bg-violet-500/[0.06] px-5 py-4">
              <span className="mb-2.5 block text-[0.78rem] font-semibold text-violet-300">✨ AI Generated Tags</span>
              <div className="flex flex-wrap gap-2">
                {TAGS.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-marketing-border-strong bg-white/[0.06] px-3 py-1.5 text-xs text-marketing-text-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </ScrollFadeIn>
      </div>
    </section>
  );
}
