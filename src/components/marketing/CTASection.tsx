import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollFadeIn } from "@/components/marketing/ScrollFadeIn";

export function CTASection() {
  return (
    <section className="px-6 py-24">
      <ScrollFadeIn
        className="mx-auto max-w-2xl rounded-3xl border border-marketing-border bg-gradient-to-br from-blue-500/[0.12] to-pink-500/10 px-12 py-16 text-center"
      >
        <h2 className="mb-3.5 text-[clamp(1.6rem,3vw,2.1rem)] font-extrabold tracking-tight text-white">
          Ready to Organize Your Knowledge?
        </h2>
        <p className="mb-7 text-marketing-text-muted">
          Join developers who stopped losing snippets, prompts, and links to chat histories and browser tabs.
        </p>
        <Link
          href="/register"
          className={cn(
            buttonVariants({ variant: "default", size: "lg" }),
            "bg-gradient-to-br from-blue-500 to-indigo-500 px-7 text-base text-white shadow-[0_4px_20px_rgba(59,130,246,0.35)] hover:from-blue-500 hover:to-indigo-500 hover:opacity-90"
          )}
        >
          Get Started Free
        </Link>
      </ScrollFadeIn>
    </section>
  );
}
