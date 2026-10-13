import { Prisma } from "@prisma/client";
import type Stripe from "stripe";
import { prisma } from "@/server/db";
import { sendUnmatchedPaymentAlert } from "@/server/email/notifications";
import { findMembership, syncMembership } from "@/server/memberships";
import { reportError } from "@/server/report-error";
import {
  getInvoiceSubscriptionId,
  isMissingResource,
  retrieveSubscription,
} from "@/server/stripe";

export type WebhookOutcome = "processed" | "duplicate" | "ignored";

function idOf(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

async function onCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<WebhookOutcome> {
  if (session.mode !== "subscription") return "ignored";
  const subscriptionId = idOf(session.subscription);
  if (!subscriptionId) return "ignored";

  const membership = await findMembership(
    subscriptionId,
    session.metadata?.membershipId ?? session.client_reference_id,
  );
  if (!membership) {
    // Someone has paid and there is no sign-up record to attach it to. This
    // must reach a person: the customer is being billed.
    reportError(
      new Error(`No membership for paid checkout session ${session.id}`),
      "stripe.webhook.checkout",
    );
    await sendUnmatchedPaymentAlert({
      sessionId: session.id,
      subscriptionId,
      customerId: idOf(session.customer),
      customerEmail: session.customer_details?.email ?? session.customer_email ?? null,
    });
    return "ignored";
  }

  await syncMembership(membership, await retrieveSubscription(subscriptionId));
  return "processed";
}

async function onInvoiceEvent(invoice: Stripe.Invoice): Promise<WebhookOutcome> {
  const subscriptionId = getInvoiceSubscriptionId(invoice);
  if (!subscriptionId) return "ignored";

  const subscription = await retrieveSubscription(subscriptionId);
  const membership = await findMembership(
    subscriptionId,
    subscription.metadata?.membershipId,
  );
  if (!membership) return "ignored";

  await syncMembership(membership, subscription);
  return "processed";
}

/**
 * Stripe does not deliver events in order and retries failed ones for days,
 * so the snapshot inside a subscription event can be older than what has
 * already been applied. The event is treated as a signal only: the current
 * subscription is fetched and that is what gets synced.
 */
async function onSubscriptionEvent(
  snapshot: Stripe.Subscription,
): Promise<WebhookOutcome> {
  let subscription = snapshot;
  try {
    subscription = await retrieveSubscription(snapshot.id);
  } catch (error) {
    // Gone from Stripe entirely: the snapshot is the best information left.
    if (!isMissingResource(error)) throw error;
  }

  const membership = await findMembership(
    subscription.id,
    subscription.metadata?.membershipId,
  );
  if (!membership) return "ignored";

  await syncMembership(membership, subscription);
  return "processed";
}

async function dispatch(event: Stripe.Event): Promise<WebhookOutcome> {
  switch (event.type) {
    case "checkout.session.completed":
      return onCheckoutCompleted(event.data.object);
    case "invoice.paid":
    case "invoice.payment_failed":
      return onInvoiceEvent(event.data.object);
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      return onSubscriptionEvent(event.data.object);
    default:
      return "ignored";
  }
}

/**
 * Handles a verified Stripe event once.
 *
 * The event id is recorded on arrival and marked processed only after the
 * handler succeeds. If the function fails or is killed part-way, the row is
 * left unprocessed and Stripe's retry runs the handler again; handlers sync
 * from live Stripe state, so running one twice is harmless.
 */
export async function handleStripeEvent(
  event: Stripe.Event,
): Promise<WebhookOutcome> {
  const seen = await prisma.stripeEvent.findUnique({ where: { id: event.id } });
  if (seen?.processedAt) return "duplicate";

  if (!seen) {
    try {
      await prisma.stripeEvent.create({
        data: { id: event.id, type: event.type },
      });
    } catch (error) {
      // The same event delivered twice at the same moment: both may proceed.
      if (
        !(
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        )
      ) {
        throw error;
      }
    }
  }

  const outcome = await dispatch(event);

  await prisma.stripeEvent.update({
    where: { id: event.id },
    data: { processedAt: new Date() },
  });
  return outcome;
}
