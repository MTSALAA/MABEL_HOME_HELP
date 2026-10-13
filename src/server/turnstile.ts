import { reportError } from "./report-error";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function isTurnstileEnabled(): boolean {
  return Boolean(
    process.env.TURNSTILE_SECRET_KEY &&
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  );
}

/**
 * Verifies a Turnstile token. When Turnstile is not configured the check is
 * skipped (the honeypot and rate limit still apply).
 */
export async function verifyTurnstile(
  token: string | undefined,
  ip: string,
): Promise<boolean> {
  if (!isTurnstileEnabled()) return true;
  if (!token) return false;

  try {
    const body = new URLSearchParams({
      secret: process.env.TURNSTILE_SECRET_KEY as string,
      response: token,
    });
    if (ip !== "unknown") body.set("remoteip", ip);

    const response = await fetch(VERIFY_URL, { method: "POST", body });
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch (error) {
    reportError(error, "turnstile.verify");
    // Cloudflare being down should not take the forms down with it.
    return true;
  }
}
