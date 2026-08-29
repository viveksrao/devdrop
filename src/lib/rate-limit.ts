import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const RATE_LIMIT_CONFIGS = {
  login: { limit: 5, window: "15 m" },
  register: { limit: 3, window: "1 h" },
  "forgot-password": { limit: 3, window: "1 h" },
  "reset-password": { limit: 5, window: "15 m" },
  "resend-verification": { limit: 3, window: "15 m" },
  checkout: { limit: 10, window: "1 h" },
} as const;

export type RateLimitName = keyof typeof RATE_LIMIT_CONFIGS;

const limiters = new Map<RateLimitName, Ratelimit>();

function getLimiter(name: RateLimitName): Ratelimit | null {
  if (!redis) return null;

  let limiter = limiters.get(name);
  if (!limiter) {
    const { limit, window } = RATE_LIMIT_CONFIGS[name];
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, window),
      prefix: `ratelimit:${name}`,
    });
    limiters.set(name, limiter);
  }
  return limiter;
}

export async function checkRateLimit(
  name: RateLimitName,
  key: string
): Promise<RateLimitResult> {
  const limiter = getLimiter(name);

  // Fail open if Upstash isn't configured or unavailable.
  if (!limiter) {
    return { success: true, remaining: Infinity, reset: 0 };
  }

  try {
    const result = await limiter.limit(key);
    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    console.error(`Rate limit check failed for "${name}":`, error);
    return { success: true, remaining: Infinity, reset: 0 };
  }
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function rateLimitResponse(reset: number): Response {
  const retryAfterSeconds = Math.max(0, Math.ceil((reset - Date.now()) / 1000));
  const retryAfterMinutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));

  return Response.json(
    {
      success: false,
      error: `Too many attempts. Please try again in ${retryAfterMinutes} minute${
        retryAfterMinutes === 1 ? "" : "s"
      }.`,
    },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    }
  );
}
