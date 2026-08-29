import { prisma } from "@/lib/prisma";

export interface UserBillingInfo {
  isPro: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

export async function getUserBillingInfo(userId: string): Promise<UserBillingInfo | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { isPro: true, stripeCustomerId: true, stripeSubscriptionId: true },
  });
}

export async function findUserByStripeCustomerId(customerId: string) {
  return prisma.user.findUnique({ where: { stripeCustomerId: customerId } });
}

export async function setUserStripeCustomerId(userId: string, stripeCustomerId: string) {
  return prisma.user.update({ where: { id: userId }, data: { stripeCustomerId } });
}

export interface SubscriptionStatus {
  isPro: boolean;
  stripeSubscriptionId: string | null;
}

export async function setUserSubscriptionStatus(userId: string, data: SubscriptionStatus) {
  return prisma.user.update({ where: { id: userId }, data });
}
