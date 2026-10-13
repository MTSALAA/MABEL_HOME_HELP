import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type RateLimitRule = { max: number; windowSec: number };

export const RATE_LIMITS = {
  /**
   * Public form submissions from one address. Ten rather than five: a
   * seniors' residence or a family home shares one address between people.
   */
  publicForm: { max: 10, windowSec: 60 * 60 },
  /** "Manage my membership" link requests, per email. */
  portalLink: { max: 3, windowSec: 60 * 60 },
  /** Admin sign-in attempts for one email from one address. */
  login: { max: 5, windowSec: 15 * 60 },
  /** All admin sign-in attempts from one address, whatever the email. */
  loginPerIp: { max: 20, windowSec: 15 * 60 },
  /**
   * All sign-in attempts for one email, from anywhere. High enough that one
   * stranger cannot lock the owner out, low enough to make guessing pointless.
   */
  loginPerEmail: { max: 50, windowSec: 60 * 60 },
  /** Password reset requests from one address. */
  passwordResetPerIp: { max: 5, windowSec: 15 * 60 },
  /** Reset emails sent to one address (also protects the email quota). */
  passwordResetPerEmail: { max: 3, windowSec: 60 * 60 },
} satisfies Record<string, RateLimitRule>;

const hasUpstash = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
);

/** False when limits only live in this server instance's memory. */
export function hasSharedRateLimit(): boolean {
  return hasUpstash;
}

const upstashLimiters = new Map<string, Ratelimit>();

function getUpstashLimiter(rule: RateLimitRule): Ratelimit {
  const id = `${rule.max}:${rule.windowSec}`;
  let limiter = upstashLimiters.get(id);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(rule.max, `${rule.windowSec} s`),
      prefix: "mabel:rl",
    });
    upstashLimiters.set(id, limiter);
  }
  return limiter;
}

// In-memory fallback for local development. Not shared between serverless
// instances, so production must configure Upstash.
const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

function memoryLimit(key: string, rule: RateLimitRule): boolean {
  const now = Date.now();
  const bucket = memoryBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + rule.windowSec * 1000 });
    return true;
  }
  if (bucket.count >= rule.max) return false;
  bucket.count += 1;
  return true;
}

/** Returns true when the action is allowed. */
export async function rateLimit(
  key: string,
  rule: RateLimitRule,
): Promise<boolean> {
  // Escape hatch for automated end-to-end tests only.
  if (process.env.RATE_LIMIT_DISABLED === "true") return true;

  if (hasUpstash) {
    try {
      const { success } = await getUpstashLimiter(rule).limit(key);
      return success;
    } catch {
      // If Redis is unreachable, fall through rather than block real users.
    }
  }
  return memoryLimit(key, rule);
}
