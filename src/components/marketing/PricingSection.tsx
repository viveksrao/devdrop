"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { ScrollFadeIn } from "@/components/marketing/ScrollFadeIn";

const FREE_FEATURES = ["50 items total", "3 collections", "Snippets, Prompts, Commands, Notes, Links", "Basic search"];

const PRO_FEATURES = [
  "Unlimited items",
  "Unlimited collections",
  "File & image uploads",
  "AI auto-tagging & summaries",
  "AI code explanation & prompt optimizer",
  "Data export (JSON/ZIP)",
  "Priority support",
];

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="px-6 py-24">
      <ScrollFadeIn className="mx-auto mb-14 max-w-xl text-center">
        <span className="mb-3 inline-block text-xs font-semibold tracking-[0.08em] text-blue-500 uppercase">
          Pricing
        </span>
        <h2 className="mb-3 text-[clamp(1.8rem,3.5vw,2.4rem)] font-extrabold tracking-tight text-white">
          Simple, honest pricing
        </h2>
        <p className="mb-7 text-[1.05rem] text-marketing-text-muted">Start free. Upgrade when you need more.</p>

        <div className="flex items-center justify-center gap-3.5">
          <span className={cn("text-sm text-marketing-text-dim", !isYearly && "font-semibold text-white")}>
            Monthly
          </span>
          <Switch checked={isYearly} onCheckedChange={setIsYearly} aria-label="Toggle yearly pricing" />
          <span className={cn("flex items-center gap-2 text-sm text-marketing-text-dim", isYearly && "font-semibold text-white")}>
            Yearly
            <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[0.7rem] font-bold text-green-400">
              Save 25%
            </span>
          </span>
        </div>
      </ScrollFadeIn>

      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
        <ScrollFadeIn>
          <div className="h-full rounded-3xl border border-marketing-border bg-marketing-bg-elevated p-9">
            <h3 className="mb-3 text-lg font-bold text-white">Free</h3>
            <p className="mb-2 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold tracking-tight text-white">$0</span>
              <span className="text-[0.95rem] text-marketing-text-dim">/mo</span>
            </p>
            <p className="mb-6 text-sm text-marketing-text-muted">For getting your knowledge out of your head.</p>
            <ul className="mb-7 flex flex-col gap-3">
              {FREE_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-[0.88rem] text-marketing-text-muted">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>
            <Link href="/register" className={cn(buttonVariants({ variant: "ghost" }), "w-full")}>
              Get Started
            </Link>
          </div>
        </ScrollFadeIn>

        <ScrollFadeIn>
          <div className="relative h-full rounded-3xl border border-blue-500/40 bg-gradient-to-b from-blue-500/[0.08] to-transparent bg-marketing-bg-elevated p-9 shadow-[0_0_80px_rgba(59,130,246,0.15)]">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-white">
              Most Popular
            </span>
            <h3 className="mb-3 text-lg font-bold text-white">Pro</h3>
            <p className="mb-2 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold tracking-tight text-white">{isYearly ? "$72" : "$8"}</span>
              <span className="text-[0.95rem] text-marketing-text-dim">{isYearly ? "/yr" : "/mo"}</span>
            </p>
            <p className="mb-6 text-sm text-marketing-text-muted">
              For developers who never want to lose a snippet again.
            </p>
            <ul className="mb-7 flex flex-col gap-3">
              {PRO_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-[0.88rem] text-marketing-text-muted">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className={cn(
                buttonVariants({ variant: "default" }),
                "w-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-[0_4px_20px_rgba(59,130,246,0.35)] hover:from-blue-500 hover:to-indigo-500 hover:opacity-90"
              )}
            >
              Start Free Trial
            </Link>
          </div>
        </ScrollFadeIn>
      </div>
    </section>
  );
}
