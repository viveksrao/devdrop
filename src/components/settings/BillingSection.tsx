"use client";

import { toast } from "sonner";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { createBillingPortalSession } from "@/actions/billing";
import { useUpgradeCheckout } from "@/hooks/useUpgradeCheckout";

interface BillingSectionProps {
  isPro: boolean;
}

export function BillingSection({ isPro }: BillingSectionProps) {
  const { isYearly, setIsYearly, isSubmitting, handleUpgrade } = useUpgradeCheckout();
  const [isManaging, setIsManaging] = useState(false);

  async function handleManageSubscription() {
    setIsManaging(true);
    const result = await createBillingPortalSession();
    setIsManaging(false);

    if (!result.success || !result.data) {
      toast.error(result.error ?? "Failed to open billing portal");
      return;
    }

    window.location.href = result.data.url;
  }

  if (isPro) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Current plan</span>
          <Badge>Pro</Badge>
        </div>
        <Button onClick={handleManageSubscription} disabled={isManaging} className="w-fit">
          {isManaging ? "Loading…" : "Manage subscription"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Current plan</span>
        <Badge variant="outline">Free</Badge>
      </div>

      <div className="flex items-center gap-3">
        <span className={!isYearly ? "text-sm font-medium" : "text-sm text-muted-foreground"}>
          Monthly
        </span>
        <Switch checked={isYearly} onCheckedChange={setIsYearly} aria-label="Toggle yearly pricing" />
        <span className={isYearly ? "text-sm font-medium" : "text-sm text-muted-foreground"}>
          Yearly
        </span>
        <Badge variant="outline" className="text-[10px] text-muted-foreground">
          Save 25%
        </Badge>
      </div>

      <Button onClick={handleUpgrade} disabled={isSubmitting} className="w-fit">
        {isSubmitting ? "Loading…" : `Upgrade to Pro — ${isYearly ? "$72/yr" : "$8/mo"}`}
      </Button>
    </div>
  );
}
