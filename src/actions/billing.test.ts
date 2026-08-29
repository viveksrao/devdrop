import { describe, expect, it, vi, beforeEach } from "vitest";

const mockAuth = vi.fn();
const mockGetUserBillingInfo = vi.fn();
const mockSetUserStripeCustomerId = vi.fn();
const mockCheckRateLimit = vi.fn();
const mockCustomersCreate = vi.fn();
const mockCheckoutSessionsCreate = vi.fn();
const mockPortalSessionsCreate = vi.fn();
const mockHeadersGet = vi.fn();

vi.mock("@/auth", () => ({ auth: mockAuth }));

vi.mock("@/lib/db/billing", () => ({
  getUserBillingInfo: mockGetUserBillingInfo,
  setUserStripeCustomerId: mockSetUserStripeCustomerId,
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mockCheckRateLimit,
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    customers: { create: mockCustomersCreate },
    checkout: { sessions: { create: mockCheckoutSessionsCreate } },
    billingPortal: { sessions: { create: mockPortalSessionsCreate } },
  },
  STRIPE_PRICE_IDS: { monthly: "price_monthly", yearly: "price_yearly" },
}));

vi.mock("next/headers", () => ({
  headers: async () => ({ get: mockHeadersGet }),
}));

const { createCheckoutSession, createBillingPortalSession } = await import("./billing");

beforeEach(() => {
  mockAuth.mockReset();
  mockGetUserBillingInfo.mockReset();
  mockSetUserStripeCustomerId.mockReset();
  mockCheckRateLimit.mockReset().mockResolvedValue({ success: true, remaining: 9, reset: 0 });
  mockCustomersCreate.mockReset();
  mockCheckoutSessionsCreate.mockReset();
  mockPortalSessionsCreate.mockReset();
  mockHeadersGet.mockReset().mockReturnValue(null);
});

describe("createCheckoutSession", () => {
  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await createCheckoutSession("monthly");

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mockGetUserBillingInfo).not.toHaveBeenCalled();
  });

  it("short-circuits when the user is already Pro", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", email: "a@b.com" } });
    mockGetUserBillingInfo.mockResolvedValueOnce({
      isPro: true,
      stripeCustomerId: "cus_123",
      stripeSubscriptionId: "sub_123",
    });

    const result = await createCheckoutSession("monthly");

    expect(result).toEqual({
      success: false,
      error: "You already have an active subscription",
    });
    expect(mockCheckoutSessionsCreate).not.toHaveBeenCalled();
  });

  it("returns the expected error shape when rate-limited", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", email: "a@b.com" } });
    mockCheckRateLimit.mockResolvedValueOnce({ success: false, remaining: 0, reset: 0 });

    const result = await createCheckoutSession("monthly");

    expect(result).toEqual({
      success: false,
      error: "Too many attempts. Please try again shortly.",
    });
    expect(mockGetUserBillingInfo).not.toHaveBeenCalled();
  });

  it("creates a Stripe customer when one doesn't exist yet and returns the checkout URL", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", email: "a@b.com" } });
    mockGetUserBillingInfo.mockResolvedValueOnce({
      isPro: false,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    });
    mockCustomersCreate.mockResolvedValueOnce({ id: "cus_new" });
    mockCheckoutSessionsCreate.mockResolvedValueOnce({ url: "https://checkout.stripe.com/xyz" });

    const result = await createCheckoutSession("yearly");

    expect(mockCustomersCreate).toHaveBeenCalledWith({
      email: "a@b.com",
      metadata: { userId: "user-1" },
    });
    expect(mockSetUserStripeCustomerId).toHaveBeenCalledWith("user-1", "cus_new");
    expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "cus_new",
        mode: "subscription",
        line_items: [{ price: "price_yearly", quantity: 1 }],
      })
    );
    expect(result).toEqual({ success: true, data: { url: "https://checkout.stripe.com/xyz" } });
  });

  it("reuses an existing Stripe customer id without creating a new one", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", email: "a@b.com" } });
    mockGetUserBillingInfo.mockResolvedValueOnce({
      isPro: false,
      stripeCustomerId: "cus_existing",
      stripeSubscriptionId: null,
    });
    mockCheckoutSessionsCreate.mockResolvedValueOnce({ url: "https://checkout.stripe.com/xyz" });

    await createCheckoutSession("monthly");

    expect(mockCustomersCreate).not.toHaveBeenCalled();
    expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_existing" })
    );
  });

  it("catches Stripe API errors and returns a generic error string", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", email: "a@b.com" } });
    mockGetUserBillingInfo.mockResolvedValueOnce({
      isPro: false,
      stripeCustomerId: "cus_existing",
      stripeSubscriptionId: null,
    });
    mockCheckoutSessionsCreate.mockRejectedValueOnce(new Error("card_declined: 4000..."));

    const result = await createCheckoutSession("monthly");

    expect(result).toEqual({ success: false, error: "Something went wrong" });
  });
});

describe("createBillingPortalSession", () => {
  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await createBillingPortalSession();

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mockGetUserBillingInfo).not.toHaveBeenCalled();
  });

  it("returns an error when the user has no Stripe customer id", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockGetUserBillingInfo.mockResolvedValueOnce({
      isPro: false,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    });

    const result = await createBillingPortalSession();

    expect(result).toEqual({ success: false, error: "No billing account found" });
    expect(mockPortalSessionsCreate).not.toHaveBeenCalled();
  });

  it("returns the portal URL for an existing customer", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockGetUserBillingInfo.mockResolvedValueOnce({
      isPro: true,
      stripeCustomerId: "cus_123",
      stripeSubscriptionId: "sub_123",
    });
    mockPortalSessionsCreate.mockResolvedValueOnce({ url: "https://billing.stripe.com/xyz" });

    const result = await createBillingPortalSession();

    expect(mockPortalSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_123" })
    );
    expect(result).toEqual({ success: true, data: { url: "https://billing.stripe.com/xyz" } });
  });

  it("catches Stripe API errors and returns a generic error string", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockGetUserBillingInfo.mockResolvedValueOnce({
      isPro: true,
      stripeCustomerId: "cus_123",
      stripeSubscriptionId: "sub_123",
    });
    mockPortalSessionsCreate.mockRejectedValueOnce(new Error("stripe down"));

    const result = await createBillingPortalSession();

    expect(result).toEqual({ success: false, error: "Something went wrong" });
  });
});
