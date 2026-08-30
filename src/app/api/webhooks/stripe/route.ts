import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { findUserByStripeCustomerId, setUserSubscriptionStatus } from "@/lib/db/billing";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        const customerId = checkoutSession.customer as string;
        const subscriptionId = checkoutSession.subscription as string;

        const user = await findUserByStripeCustomerId(customerId);
        if (user) {
          await setUserSubscriptionStatus(user.id, {
            isPro: true,
            stripeSubscriptionId: subscriptionId,
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const user = await findUserByStripeCustomerId(customerId);
        if (user) {
          const isActive = subscription.status === "active" || subscription.status === "trialing";
          await setUserSubscriptionStatus(user.id, {
            isPro: isActive,
            stripeSubscriptionId: isActive ? subscription.id : null,
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const user = await findUserByStripeCustomerId(customerId);
        if (user) {
          await setUserSubscriptionStatus(user.id, {
            isPro: false,
            stripeSubscriptionId: null,
          });
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`Failed to handle Stripe webhook event ${event.type}:`, error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
