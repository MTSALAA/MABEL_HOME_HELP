import type Stripe from "stripe";
import { reportError } from "@/server/report-error";
import { getStripe } from "@/server/stripe";
import { handleStripeEvent } from "@/server/stripe-webhook";

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return new Response("Stripe is not configured", { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  // The signature covers the exact bytes Stripe sent, so read the raw body.
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(payload, signature, secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    const outcome = await handleStripeEvent(event);
    return Response.json({ received: true, outcome });
  } catch (error) {
    reportError(error, `stripe.webhook ${event.type} ${event.id}`);
    // A 5xx makes Stripe retry later.
    return new Response("Webhook handler failed", { status: 500 });
  }
}
