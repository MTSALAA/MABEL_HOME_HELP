export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

/** Cache tag for everything the admin can edit and the public site reads. */
export const CONTENT_TAG = "content";

/** Keys of the SVGs in public/illustrations that a service can use. */
export const SERVICE_ILLUSTRATIONS = [
  "senior-home-check-ins",
  "companionship",
  "garbage-recycling",
  "light-house-cleaning",
  "garage-cleaning",
  "car-cleaning",
  "snow-removal",
  "lawn-yard-maintenance",
  "grocery-pharmacy-pickup",
  "errands-shopping",
  "family-updates",
  "acreage-rural-help",
  "basic-roadside-assistance",
] as const;

export type ServiceIllustration = (typeof SERVICE_ILLUSTRATIONS)[number];

export const ADMIN_PAGE_SIZE = 20;

/**
 * How long an unpaid sign-up is kept when Stripe can't say what happened to
 * it. Longer than a checkout session lives (24h) plus Stripe's webhook retry
 * window (3 days), so a late payment confirmation always finds its record.
 */
export const PENDING_MEMBERSHIP_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Lifetime of the emailed "manage my membership" link. */
export const PORTAL_LINK_TTL_MS = 30 * 60 * 1000;

/** Prefix of the admin session cookie (shared by the auth config and the proxy). */
export const AUTH_COOKIE_PREFIX = "mabel";

/** Requests and sponsor inquiries are deleted after this long (privacy policy). */
export const REQUEST_RETENTION_MONTHS = 24;
