import type { Membership, MembershipStatus } from "@prisma/client";
import type Stripe from "stripe";
import { PENDING_MEMBERSHIP_TTL_MS } from "@/lib/constants";
import { prisma } from "@/server/db";
import {
  sendMembershipActivatedEmails,
  sendMembershipCanceledEmail,
  sendPaymentFailedEmails,
} from "@/server/email/notifications";
import { reportError } from "@/server/report-error";
import {
  getPeriodEnd,
  getStripe,
  getSubscriptionPriceId,
  isMissingResource,
  retrieveSubscription,
} from "@/server/stripe";

function idOf(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

function mapStatus(status: Stripe.Subscription.Status): MembershipStatus | null {
  switch (status) {
    case "active":
    case "trialing":
      return "ACTIVE";
    case "past_due":
    case "unpaid":
      return "PAST_DUE";
    case "canceled":
    case "incomplete_expired":
      return "CANCELED";
    default:
      // "incomplete" and "paused": leave the membership as it is.
      return null;
  }
}

export async function findMembership(
  subscriptionId: string | null,
  membershipId: string | null | undefined,
): Promise<Membership | null> {
  if (subscriptionId) {
    const bySubscription = await prisma.membership.findUnique({
      where: { stripeSubscriptionId: subscriptionId },
    });
    if (bySubscription) return bySubscription;
  }
  if (membershipId) {
    return prisma.membership.findUnique({ where: { id: membershipId } });
  }
  return null;
}

/**
 * Applies the current state of a Stripe subscription to its membership.
 *
 * A status change is claimed with a conditional update, so when several
 * events for the same sign-up are handled at once only one of them wins the
 * transition and sends the email.
 */
export async function syncMembership(
  membership: Membership,
  subscription: Stripe.Subscription,
): Promise<void> {
  const previousStatus = membership.status;
  const nextStatus = mapStatus(subscription.status) ?? previousStatus;

  const data = {
    status: nextStatus,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: idOf(subscription.customer) ?? membership.stripeCustomerId,
    stripePriceId: getSubscriptionPriceId(subscription) ?? membership.stripePriceId,
    currentPeriodEnd: getPeriodEnd(subscription) ?? membership.currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    canceledAt:
      nextStatus === "CANCELED" ? (membership.canceledAt ?? new Date()) : null,
  };

  if (nextStatus === previousStatus) {
    await prisma.membership.update({ where: { id: membership.id }, data });
    return;
  }

  const claimed = await prisma.membership.updateMany({
    where: { id: membership.id, status: previousStatus },
    data,
  });
  if (claimed.count === 0) {
    // Another event made the transition first and owns the notification.
    await prisma.membership.update({ where: { id: membership.id }, data });
    return;
  }

  const updated = await prisma.membership.findUnique({
    where: { id: membership.id },
    include: { plan: true },
  });
  if (!updated) return;

  if (nextStatus === "ACTIVE" && previousStatus === "PENDING") {
    await sendMembershipActivatedEmails(updated, updated.plan);
  } else if (nextStatus === "PAST_DUE") {
    await sendPaymentFailedEmails(updated, updated.plan);
  } else if (nextStatus === "CANCELED" && previousStatus !== "PENDING") {
    await sendMembershipCanceledEmail(updated, updated.plan);
  }
}

/**
 * Looks after sign-ups still marked unpaid, by asking Stripe what really
 * happened to each checkout:
 *
 * - paid (the webhook was missed or misconfigured): the membership is
 *   activated from the live subscription, so no paying customer is lost;
 * - expired or abandoned: the row is removed once it is old enough.
 *
 * Nothing is ever deleted on age alone while Stripe can still answer.
 */
export async function reconcilePendingMemberships(): Promise<void> {
  const stripe = getStripe();
  const settledBefore = new Date(Date.now() - 30 * 60 * 1000);
  const expiredBefore = new Date(Date.now() - PENDING_MEMBERSHIP_TTL_MS);

  const pending = await prisma.membership.findMany({
    where: { status: "PENDING", createdAt: { lt: settledBefore } },
    orderBy: { createdAt: "asc" },
    take: 10,
  });

  await Promise.all(
    pending.map(async (membership) => {
      const isOld = membership.createdAt < expiredBefore;
      const remove = () =>
        prisma.membership
          .deleteMany({ where: { id: membership.id, status: "PENDING" } })
          .then(() => undefined);

      // Never reached Stripe (the checkout session could not be created).
      if (!membership.stripeCheckoutSessionId) {
        if (isOld) await remove();
        return;
      }
      // Without Stripe there is no way to know: keep the row.
      if (!stripe) return;

      try {
        const session = await stripe.checkout.sessions.retrieve(
          membership.stripeCheckoutSessionId,
        );
        const subscriptionId = idOf(session.subscription);
        if (session.status === "complete" && subscriptionId) {
          await syncMembership(membership, await retrieveSubscription(subscriptionId));
        } else if (session.status === "expired" || isOld) {
          await remove();
        }
      } catch (error) {
        if (isMissingResource(error)) {
          // The session belongs to another Stripe account or mode.
          if (isOld) await remove();
        } else {
          reportError(error, "memberships.reconcile");
        }
      }
    }),
  );
}
