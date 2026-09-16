import { useState } from "react";
import { toast } from "sonner";
import { createCheckoutSession } from "@/actions/billing";
import type { BillingInterval } from "@/lib/stripe";

export function useUpgradeCheckout() {
  const [isYearly, setIsYearly] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleUpgrade() {
    setIsSubmitting(true);
    const interval: BillingInterval = isYearly ? "yearly" : "monthly";
    const result = await createCheckoutSession(interval);
    setIsSubmitting(false);

    if (!result.success || !result.data) {
      toast.error(result.error ?? "Failed to start checkout");
      return;
    }

    window.location.href = result.data.url;
  }

  return { isYearly, setIsYearly, isSubmitting, handleUpgrade };
}
