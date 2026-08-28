import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollFadeIn } from "@/components/marketing/ScrollFadeIn";
import { ChaosOrderVisual } from "@/components/marketing/ChaosOrderVisual";

export function HeroSection() {
  return (
    <section className="px-6 pt-40 pb-24">
      <ScrollFadeIn className="mx-auto mb-18 max-w-2xl text-center">
        <span className="mb-3 inline-block text-xs font-semibold tracking-[0.08em] text-blue-500 uppercase">
          Developer Knowledge Hub
        </span>
        <h1 className="mb-5 text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.1] font-extrabold tracking-tight text-white">
          Stop Losing Your{" "}
          <span className="bg-gradient-to-br from-blue-500 via-violet-500 to-pink-500 bg-clip-text text-transparent">
            Developer Knowledge
          </span>
        </h1>
        <p className="mx-auto mb-8 max-w-md text-lg text-marketing-text-muted">
          Snippets, prompts, commands, notes, files, and links — scattered across a dozen tools. DevDrop brings it
          all into one fast, searchable, AI-enhanced hub.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3.5">
          <Link
            href="/register"
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "bg-gradient-to-br from-blue-500 to-indigo-500 px-7 text-base text-white shadow-[0_4px_20px_rgba(59,130,246,0.35)] hover:from-blue-500 hover:to-indigo-500 hover:opacity-90"
            )}
          >
            Get Started Free
          </Link>
          <a href="#features" className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "px-7 text-base")}>
            See Features
          </a>
        </div>
      </ScrollFadeIn>

      <ScrollFadeIn>
        <ChaosOrderVisual />
      </ScrollFadeIn>
    </section>
  );
}
