import { describe, expect, it } from "vitest";
import { prismaMock } from "@/lib/__mocks__/prisma";
import {
  getUserBillingInfo,
  findUserByStripeCustomerId,
  setUserStripeCustomerId,
  setUserSubscriptionStatus,
} from "./billing";

describe("getUserBillingInfo", () => {
  it("returns isPro/stripeCustomerId/stripeSubscriptionId for a user", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      isPro: true,
      stripeCustomerId: "cus_123",
      stripeSubscriptionId: "sub_123",
    } as never);

    const result = await getUserBillingInfo("user-1");

    expect(result).toEqual({
      isPro: true,
      stripeCustomerId: "cus_123",
      stripeSubscriptionId: "sub_123",
    });
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: { isPro: true, stripeCustomerId: true, stripeSubscriptionId: true },
    });
  });

  it("returns null when the user doesn't exist", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);

    const result = await getUserBillingInfo("missing-user");

    expect(result).toBeNull();
  });
});

describe("findUserByStripeCustomerId", () => {
  it("looks up a user by their Stripe customer id", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: "user-1" } as never);

    const result = await findUserByStripeCustomerId("cus_123");

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { stripeCustomerId: "cus_123" },
    });
    expect(result).toEqual({ id: "user-1" });
  });
});

describe("setUserStripeCustomerId", () => {
  it("updates the user's stripeCustomerId", async () => {
    prismaMock.user.update.mockResolvedValueOnce({ id: "user-1" } as never);

    await setUserStripeCustomerId("user-1", "cus_123");

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { stripeCustomerId: "cus_123" },
    });
  });
});

describe("setUserSubscriptionStatus", () => {
  it("updates isPro and stripeSubscriptionId together", async () => {
    prismaMock.user.update.mockResolvedValueOnce({ id: "user-1" } as never);

    await setUserSubscriptionStatus("user-1", {
      isPro: true,
      stripeSubscriptionId: "sub_123",
    });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { isPro: true, stripeSubscriptionId: "sub_123" },
    });
  });

  it("supports clearing the subscription (downgrade)", async () => {
    prismaMock.user.update.mockResolvedValueOnce({ id: "user-1" } as never);

    await setUserSubscriptionStatus("user-1", {
      isPro: false,
      stripeSubscriptionId: null,
    });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { isPro: false, stripeSubscriptionId: null },
    });
  });
});
