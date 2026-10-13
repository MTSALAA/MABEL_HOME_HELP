import { REQUEST_RETENTION_MONTHS } from "@/lib/constants";
import { prisma } from "@/server/db";
import { reconcilePendingMemberships } from "@/server/memberships";
import { reportError } from "@/server/report-error";

function monthsAgo(months: number): Date {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date;
}

/**
 * Routine clean-up, run after the admin overview loads (there is no separate
 * scheduler). Each step is independent: one failing never blocks the others.
 *
 * - Requests and sponsor inquiries past the retention period are deleted, as
 *   the privacy policy promises.
 * - Unpaid sign-ups are checked against Stripe (see memberships.ts).
 * - Expired sessions, used reset tokens and old webhook receipts are removed.
 */
export async function runHousekeeping(): Promise<void> {
  const retentionCutoff = monthsAgo(REQUEST_RETENTION_MONTHS);
  const now = new Date();

  const steps: [string, () => Promise<unknown>][] = [
    [
      "requests",
      () =>
        prisma.bookingRequest.deleteMany({
          where: { createdAt: { lt: retentionCutoff } },
        }),
    ],
    [
      "sponsors",
      () =>
        prisma.sponsorInquiry.deleteMany({
          where: { createdAt: { lt: retentionCutoff } },
        }),
    ],
    ["memberships", () => reconcilePendingMemberships()],
    ["sessions", () => prisma.session.deleteMany({ where: { expiresAt: { lt: now } } })],
    [
      "verifications",
      () => prisma.verification.deleteMany({ where: { expiresAt: { lt: now } } }),
    ],
    [
      "stripeEvents",
      () =>
        prisma.stripeEvent.deleteMany({
          where: { processedAt: { lt: monthsAgo(3) } },
        }),
    ],
  ];

  await Promise.all(
    steps.map(async ([name, step]) => {
      try {
        await step();
      } catch (error) {
        reportError(error, `housekeeping.${name}`);
      }
    }),
  );
}
