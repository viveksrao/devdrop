"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useUpgradeCheckout } from "@/hooks/useUpgradeCheckout";
import { PLAN_FEATURES } from "@/lib/constants/plan-limits";
import { cn } from "@/lib/utils";

export function UpgradePricing() {
  const { isYearly, setIsYearly, isSubmitting, handleUpgrade } = useUpgradeCheckout();

  return (
    <div className="flex flex-col items-center gap-10">
      <div className="flex items-center justify-center gap-3.5">
        <span className={cn("text-sm text-muted-foreground", !isYearly && "font-semibold text-foreground")}>
          Monthly
        </span>
        <Switch checked={isYearly} onCheckedChange={setIsYearly} aria-label="Toggle yearly pricing" />
        <span className={cn("flex items-center gap-2 text-sm text-muted-foreground", isYearly && "font-semibold text-foreground")}>
          Yearly
          <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[0.7rem] font-bold text-green-600 dark:text-green-400">
            Save 25%
          </span>
        </span>
      </div>

      <div className="grid w-full max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="h-full rounded-3xl border border-border bg-card p-9">
          <h3 className="mb-3 text-lg font-bold text-foreground">Free</h3>
          <p className="mb-2 flex items-baseline gap-1">
            <span className="text-4xl font-extrabold tracking-tight text-foreground">$0</span>
            <span className="text-[0.95rem] text-muted-foreground">/mo</span>
          </p>
          <p className="mb-6 text-sm text-muted-foreground">Your current plan.</p>
          <ul className="flex flex-col gap-3">
            {PLAN_FEATURES.free.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-[0.88rem] text-muted-foreground">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-500" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative h-full rounded-3xl border border-blue-500/40 bg-gradient-to-b from-blue-500/[0.08] to-transparent p-9 shadow-[0_0_80px_rgba(59,130,246,0.15)]">
          <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-white">
            Most Popular
          </span>
          <h3 className="mb-3 text-lg font-bold text-foreground">Pro</h3>
          <p className="mb-2 flex items-baseline gap-1">
            <span className="text-4xl font-extrabold tracking-tight text-foreground">
              {isYearly ? "$72" : "$8"}
            </span>
            <span className="text-[0.95rem] text-muted-foreground">{isYearly ? "/yr" : "/mo"}</span>
          </p>
          <p className="mb-6 text-sm text-muted-foreground">
            For developers who never want to lose a snippet again.
          </p>
          <ul className="mb-7 flex flex-col gap-3">
            {PLAN_FEATURES.pro.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-[0.88rem] text-muted-foreground">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-500" />
                {feature}
              </li>
            ))}
          </ul>
          <Button
            onClick={handleUpgrade}
            disabled={isSubmitting}
            className="w-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-[0_4px_20px_rgba(59,130,246,0.35)] hover:from-blue-500 hover:to-indigo-500 hover:opacity-90"
          >
            {isSubmitting ? "Loading…" : `Upgrade to Pro — ${isYearly ? "$72/yr" : "$8/mo"}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
