"use server";

import { headers } from "next/headers";
import { requireSession } from "@/lib/auth-helpers";
import { stripe, STRIPE_PRICE_IDS, type BillingInterval } from "@/lib/stripe";
import { getUserBillingInfo, setUserStripeCustomerId } from "@/lib/db/billing";
import { checkRateLimit, getClientIpFromHeaderList } from "@/lib/rate-limit";

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function createCheckoutSession(
  interval: BillingInterval
): Promise<ActionResult<{ url: string }>> {
  const { session, error } = await requireSession();
  if (!session) {
    return { success: false, error };
  }

  const ip = getClientIpFromHeaderList(await headers());
  const rateLimit = await checkRateLimit("checkout", `${ip}:${session.user.id}`);
  if (!rateLimit.success) {
    return { success: false, error: "Too many attempts. Please try again shortly." };
  }

  try {
    const billing = await getUserBillingInfo(session.user.id);
    if (billing?.isPro) {
      return { success: false, error: "You already have an active subscription" };
    }

    let customerId = billing?.stripeCustomerId ?? undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email ?? undefined,
        metadata: { userId: session.user.id },
      });
      customerId = customer.id;
      await setUserStripeCustomerId(session.user.id, customerId);
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: STRIPE_PRICE_IDS[interval], quantity: 1 }],
      success_url: `${APP_URL}/settings?checkout=success`,
      cancel_url: `${APP_URL}/settings?checkout=cancelled`,
      client_reference_id: session.user.id,
    });

    if (!checkoutSession.url) {
      return { success: false, error: "Something went wrong" };
    }

    return { success: true, data: { url: checkoutSession.url } };
  } catch (error) {
    console.error("Failed to create checkout session:", error);
    return { success: false, error: "Something went wrong" };
  }
}

export async function createBillingPortalSession(): Promise<ActionResult<{ url: string }>> {
  const { session, error } = await requireSession();
  if (!session) {
    return { success: false, error };
  }

  try {
    const billing = await getUserBillingInfo(session.user.id);
    if (!billing?.stripeCustomerId) {
      return { success: false, error: "No billing account found" };
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: billing.stripeCustomerId,
      return_url: `${APP_URL}/settings`,
    });

    return { success: true, data: { url: portalSession.url } };
  } catch (error) {
    console.error("Failed to create billing portal session:", error);
    return { success: false, error: "Something went wrong" };
  }
}
