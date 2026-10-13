import { createHmac, timingSafeEqual } from "node:crypto";
import { PORTAL_LINK_TTL_MS } from "@/lib/constants";

// Stateless, signed, short-lived token for the emailed "manage my membership"
// link. It only ever carries a Stripe customer id and an expiry.

function sign(payload: string): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("BETTER_AUTH_SECRET is not set");
  return createHmac("sha256", `portal-link:${secret}`)
    .update(payload)
    .digest("base64url");
}

export function createPortalToken(
  stripeCustomerId: string,
  now: number = Date.now(),
): string {
  const payload = Buffer.from(
    JSON.stringify({ c: stripeCustomerId, e: now + PORTAL_LINK_TTL_MS }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/** Returns the Stripe customer id, or null if the token is invalid or expired. */
export function verifyPortalToken(
  token: string,
  now: number = Date.now(),
): string | null {
  const [payload, signature, ...rest] = token.split(".");
  if (!payload || !signature || rest.length > 0) return null;

  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);
  if (expected.length !== received.length) return null;
  if (!timingSafeEqual(expected, received)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      c?: unknown;
      e?: unknown;
    };
    if (typeof data.c !== "string" || typeof data.e !== "number") return null;
    if (data.e < now) return null;
    return data.c;
  } catch {
    return null;
  }
}
