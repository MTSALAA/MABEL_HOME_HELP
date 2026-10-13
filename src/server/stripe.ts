import type { Membership, Plan } from "@prisma/client";
import Stripe from "stripe";
import type { AppLocale } from "@/i18n/routing";
import { SITE_URL } from "@/lib/constants";
import { localePrefix } from "@/lib/locale";

let stripeClient: Stripe | null = null;

/**
 * True only when checkout can complete end to end. The webhook secret is
 * required too: without it payments would succeed while the webhook rejects
 * every event, leaving paid memberships stuck as unpaid.
 */
export function isStripeEnabled(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET,
  );
}

/** Which Stripe settings are still missing, for the admin's warnings. */
export function missingStripeConfig(): "all" | "webhook" | null {
  if (!process.env.STRIPE_SECRET_KEY) return "all";
  if (!process.env.STRIPE_WEBHOOK_SECRET) return "webhook";
  return null;
}

/** Stripe answers this when an id belongs to another account or mode. */
function isMissingResource(error: unknown): boolean {
  return (
    error instanceof Stripe.errors.StripeInvalidRequestError &&
    error.code === "resource_missing"
  );
}

/** Null when no Stripe key is set. */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  stripeClient ??= new Stripe(key);
  return stripeClient;
}

function stripeLocale(locale: AppLocale): "en" | "fr-CA" {
  return locale === "fr" ? "fr-CA" : "en";
}

/**
 * Makes sure a purchasable plan has a Stripe product and a monthly CAD price
 * matching `monthlyCents`. A changed amount creates a NEW price; existing
 * subscribers stay on the price they signed up with.
 */
export async function syncPlanWithStripe(
  plan: Pick<
    Plan,
    "id" | "slug" | "nameEn" | "monthlyCents" | "stripeProductId" | "stripePriceId"
  >,
): Promise<{ stripeProductId: string; stripePriceId: string } | null> {
  const stripe = getStripe();
  if (!stripe || plan.monthlyCents === null) return null;

  // Stored ids can point at another Stripe account or mode, for example after
  // switching from test keys to live keys. Those are replaced, not fatal.
  let productId = plan.stripeProductId;
  if (productId) {
    try {
      await stripe.products.update(productId, { name: plan.nameEn });
    } catch (error) {
      if (!isMissingResource(error)) throw error;
      productId = null;
    }
  }
  if (!productId) {
    const product = await stripe.products.create({
      name: plan.nameEn,
      metadata: { planId: plan.id, planSlug: plan.slug },
    });
    productId = product.id;
  }

  let priceId = plan.stripePriceId;
  if (priceId) {
    try {
      const current = await stripe.prices.retrieve(priceId);
      const currentProduct =
        typeof current.product === "string" ? current.product : current.product.id;
      const stillMatches =
        current.active &&
        currentProduct === productId &&
        current.currency === "cad" &&
        current.unit_amount === plan.monthlyCents &&
        current.recurring?.interval === "month";
      if (!stillMatches) priceId = null;
    } catch (error) {
      if (!isMissingResource(error)) throw error;
      priceId = null;
    }
  }
  if (!priceId) {
    const price = await stripe.prices.create({
      product: productId,
      currency: "cad",
      unit_amount: plan.monthlyCents,
      recurring: { interval: "month" },
      metadata: { planId: plan.id, planSlug: plan.slug },
    });
    priceId = price.id;
  }

  return { stripeProductId: productId, stripePriceId: priceId };
}

export async function createMembershipCheckout(
  membership: Pick<Membership, "id" | "payerEmail">,
  stripePriceId: string,
  locale: AppLocale,
): Promise<{ id: string; url: string }> {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured");

  const base = `${SITE_URL}${localePrefix(locale)}`;
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: stripePriceId, quantity: 1 }],
    customer_email: membership.payerEmail,
    client_reference_id: membership.id,
    locale: stripeLocale(locale),
    success_url: `${base}/membership/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/pricing`,
    metadata: { membershipId: membership.id },
    // Copied onto the subscription so webhooks can always find the membership,
    // whatever order the events arrive in.
    subscription_data: { metadata: { membershipId: membership.id } },
    ...(process.env.STRIPE_AUTOMATIC_TAX === "true"
      ? { automatic_tax: { enabled: true } }
      : {}),
  });

  if (!session.url) throw new Error("Stripe returned no checkout URL");
  return { id: session.id, url: session.url };
}

export async function createPortalUrl(
  stripeCustomerId: string,
  locale: AppLocale,
): Promise<string> {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured");

  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    locale: stripeLocale(locale),
    return_url: `${SITE_URL}${localePrefix(locale)}/pricing`,
  });
  return session.url;
}

export async function cancelSubscriptionAtPeriodEnd(
  stripeSubscriptionId: string,
): Promise<Stripe.Subscription> {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured");
  return stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: true,
  });
}

export async function retrieveSubscription(id: string): Promise<Stripe.Subscription> {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured");
  return stripe.subscriptions.retrieve(id);
}

/**
 * Billing period end. Current API versions put it on the subscription item;
 * older ones (a webhook endpoint created long ago) put it on the subscription.
 */
export function getPeriodEnd(subscription: Stripe.Subscription): Date | null {
  const seconds =
    subscription.items?.data[0]?.current_period_end ??
    (subscription as { current_period_end?: number }).current_period_end;
  return typeof seconds === "number" ? new Date(seconds * 1000) : null;
}

/** The subscription an invoice belongs to, in current and older API shapes. */
export function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const subscription =
    invoice.parent?.subscription_details?.subscription ??
    (invoice as { subscription?: string | { id: string } | null }).subscription;
  if (!subscription) return null;
  return typeof subscription === "string" ? subscription : subscription.id;
}

export function getSubscriptionPriceId(
  subscription: Stripe.Subscription,
): string | null {
  return subscription.items?.data[0]?.price?.id ?? null;
}

export { isMissingResource };
