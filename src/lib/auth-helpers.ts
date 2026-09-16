import { headers } from "next/headers";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { checkRateLimit, getClientIpFromHeaderList, type RateLimitName } from "@/lib/rate-limit";

export async function requireSession(): Promise<
  { session: Session; error?: undefined } | { session?: undefined; error: string }
> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized" };
  }
  return { session };
}

export async function requireProAiAccess(
  session: Session,
  rateLimitName: RateLimitName
): Promise<{ error?: string }> {
  if (!session.user.isPro) {
    return { error: "AI features require DevDrop Pro" };
  }

  const ip = getClientIpFromHeaderList(await headers());
  const rateLimit = await checkRateLimit(rateLimitName, `${ip}:${session.user.id}`);
  if (!rateLimit.success) {
    return { error: "Too many AI requests. Please try again shortly." };
  }

  return {};
}
