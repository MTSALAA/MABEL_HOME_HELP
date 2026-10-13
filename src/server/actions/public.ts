"use server";

import { after } from "next/server";
import { SITE_URL } from "@/lib/constants";
import { fromDbLocale, localePrefix, toDbLocale } from "@/lib/locale";
import { pick } from "@/lib/localize";
import { normalizePhone } from "@/lib/phone";
import { emptyToNull } from "@/lib/utils";
import {
  bookingSchema,
  contactSchema,
  formMetaSchema,
  manageSchema,
  membershipSchema,
  sponsorSchema,
  UNSURE,
  type FormMeta,
  type PublicFormResult,
} from "@/lib/validation/public";
import { prisma } from "@/server/db";
import {
  sendPortalLinkEmail,
  sendRequestEmails,
  sendSponsorEmails,
} from "@/server/email/notifications";
import { createPortalToken } from "@/server/portal-token";
import { RATE_LIMITS, rateLimit } from "@/server/rate-limit";
import { reportError } from "@/server/report-error";
import { getClientIp } from "@/server/request-meta";
import { createMembershipCheckout, isStripeEnabled } from "@/server/stripe";
import { verifyTurnstile } from "@/server/turnstile";

type Guard =
  | { proceed: true; meta: FormMeta }
  | { proceed: false; result: PublicFormResult };

async function guardSubmission(rawMeta: unknown): Promise<Guard> {
  const meta = formMetaSchema.safeParse(rawMeta);
  if (!meta.success) {
    return { proceed: false, result: { ok: false, error: "validation" } };
  }
  // The hidden field was filled in. Almost always a bot, but a browser
  // extension can do it to a real person too, so they get a visible error
  // (with the phone number beside it) rather than a fake "sent".
  if (meta.data.website) {
    return { proceed: false, result: { ok: false, error: "spam" } };
  }

  const ip = await getClientIp();
  if (!(await rateLimit(`form:${ip}`, RATE_LIMITS.publicForm))) {
    return { proceed: false, result: { ok: false, error: "rateLimited" } };
  }
  if (!(await verifyTurnstile(meta.data.turnstileToken, ip))) {
    return { proceed: false, result: { ok: false, error: "spam" } };
  }
  return { proceed: true, meta: meta.data };
}

function storedPhone(input: string): string {
  return normalizePhone(input) ?? input.trim();
}

export async function submitBooking(
  values: unknown,
  rawMeta: unknown,
): Promise<PublicFormResult> {
  const guard = await guardSubmission(rawMeta);
  if (!guard.proceed) return guard.result;

  const parsed = bookingSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "validation" };
  const data = parsed.data;

  try {
    const [service, plan] = await Promise.all([
      data.serviceId !== UNSURE
        ? prisma.service.findFirst({ where: { id: data.serviceId, isActive: true } })
        : null,
      data.planId && data.planId !== UNSURE
        ? prisma.plan.findFirst({ where: { id: data.planId, isActive: true } })
        : null,
    ]);

    const request = await prisma.bookingRequest.create({
      data: {
        type: "BOOKING",
        locale: toDbLocale(guard.meta.locale),
        fullName: data.fullName,
        phone: storedPhone(data.phone),
        email: emptyToNull(data.email),
        requesterRole: data.requesterRole,
        serviceId: service?.id ?? null,
        planId: plan?.id ?? null,
        area: data.area,
        contactMethod: data.contactMethod,
        preferredTime: emptyToNull(data.preferredTime),
        message: emptyToNull(data.message),
        consentAt: new Date(),
      },
    });

    // The request is saved; emails go out after the response and can never
    // fail the submission.
    after(() =>
      sendRequestEmails(request, {
        serviceTitle: service?.titleEn ?? null,
        planName: plan?.nameEn ?? null,
      }),
    );
    return { ok: true };
  } catch (error) {
    reportError(error, "public.submitBooking");
    return { ok: false, error: "server" };
  }
}

export async function submitContact(
  values: unknown,
  rawMeta: unknown,
): Promise<PublicFormResult> {
  const guard = await guardSubmission(rawMeta);
  if (!guard.proceed) return guard.result;

  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "validation" };
  const data = parsed.data;

  try {
    const request = await prisma.bookingRequest.create({
      data: {
        type: "GENERAL",
        locale: toDbLocale(guard.meta.locale),
        fullName: data.fullName,
        phone: storedPhone(data.phone),
        email: emptyToNull(data.email),
        message: data.message,
        consentAt: new Date(),
      },
    });
    after(() => sendRequestEmails(request, { serviceTitle: null, planName: null }));
    return { ok: true };
  } catch (error) {
    reportError(error, "public.submitContact");
    return { ok: false, error: "server" };
  }
}

export async function submitSponsor(
  values: unknown,
  rawMeta: unknown,
): Promise<PublicFormResult> {
  const guard = await guardSubmission(rawMeta);
  if (!guard.proceed) return guard.result;

  const parsed = sponsorSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "validation" };
  const data = parsed.data;

  try {
    const inquiry = await prisma.sponsorInquiry.create({
      data: {
        locale: toDbLocale(guard.meta.locale),
        fullName: data.fullName,
        phone: data.phone ? storedPhone(data.phone) : null,
        email: data.email,
        organization: emptyToNull(data.organization),
        intent: data.intent,
        message: emptyToNull(data.message),
        consentAt: new Date(),
      },
    });
    after(() => sendSponsorEmails(inquiry));
    return { ok: true };
  } catch (error) {
    reportError(error, "public.submitSponsor");
    return { ok: false, error: "server" };
  }
}

/**
 * Saves a PENDING membership and returns the Stripe Checkout URL. The price is
 * always taken from the database, never from the browser. The membership only
 * becomes ACTIVE once Stripe confirms payment (see server/memberships.ts).
 */
export async function startMembership(
  planSlug: unknown,
  values: unknown,
  rawMeta: unknown,
): Promise<PublicFormResult<{ url?: string }>> {
  const guard = await guardSubmission(rawMeta);
  if (!guard.proceed) return guard.result;

  const parsed = membershipSchema.safeParse(values);
  if (!parsed.success || typeof planSlug !== "string") {
    return { ok: false, error: "validation" };
  }
  const data = parsed.data;

  try {
    const [plan, settings] = await Promise.all([
      prisma.plan.findFirst({ where: { slug: planSlug, isActive: true } }),
      prisma.siteSettings.findUnique({ where: { id: 1 } }),
    ]);

    if (
      !isStripeEnabled() ||
      !plan ||
      !plan.isPurchasable ||
      !plan.stripePriceId
    ) {
      return { ok: false, error: "unavailable" };
    }
    // Online purchase is only offered inside the service area.
    if (!settings?.serviceAreasEn.includes(data.area)) {
      return { ok: false, error: "validation" };
    }

    const isSelf = data.requesterRole === "SELF";
    const membership = await prisma.membership.create({
      data: {
        planId: plan.id,
        locale: toDbLocale(guard.meta.locale),
        payerName: data.payerName,
        payerPhone: storedPhone(data.payerPhone),
        payerEmail: data.payerEmail.toLowerCase(),
        requesterRole: data.requesterRole,
        recipientName: isSelf ? null : emptyToNull(data.recipientName),
        recipientPhone:
          isSelf || !data.recipientPhone ? null : storedPhone(data.recipientPhone),
        serviceAddress: data.serviceAddress,
        area: data.area,
        notes: emptyToNull(data.notes),
        consentAt: new Date(),
      },
    });

    try {
      const session = await createMembershipCheckout(
        membership,
        plan.stripePriceId,
        guard.meta.locale,
      );
      await prisma.membership.update({
        where: { id: membership.id },
        data: { stripeCheckoutSessionId: session.id },
      });
      return { ok: true, url: session.url };
    } catch (error) {
      await prisma.membership
        .delete({ where: { id: membership.id } })
        .catch(() => undefined);
      throw error;
    }
  } catch (error) {
    reportError(error, "public.startMembership");
    return { ok: false, error: "server" };
  }
}

/**
 * Emails a short-lived link to the Stripe billing portal. The response is the
 * same whether or not a membership exists, so it can't be used to look up
 * members.
 */
export async function requestPortalLink(
  values: unknown,
  rawMeta: unknown,
): Promise<PublicFormResult> {
  const guard = await guardSubmission(rawMeta);
  if (!guard.proceed) return guard.result;

  const parsed = manageSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "validation" };
  const email = parsed.data.email.toLowerCase();

  if (!(await rateLimit(`portal:${email}`, RATE_LIMITS.portalLink))) {
    return { ok: false, error: "rateLimited" };
  }

  try {
    const memberships = await prisma.membership.findMany({
      where: {
        payerEmail: email,
        stripeCustomerId: { not: null },
        status: { not: "PENDING" },
      },
      include: { plan: { select: { nameEn: true, nameFr: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Each sign-up has its own Stripe customer, so someone paying for two
    // relatives gets one link per membership, live ones first.
    const rank = { ACTIVE: 0, PAST_DUE: 1, CANCELED: 2, PENDING: 3 } as const;
    const perCustomer = new Map<string, (typeof memberships)[number]>();
    for (const membership of [...memberships].sort(
      (a, b) => rank[a.status] - rank[b.status],
    )) {
      if (
        membership.stripeCustomerId &&
        !perCustomer.has(membership.stripeCustomerId)
      ) {
        perCustomer.set(membership.stripeCustomerId, membership);
      }
    }
    const targets = [...perCustomer.entries()].slice(0, 5);

    if (targets.length > 0 && isStripeEnabled()) {
      const pagePrefix = localePrefix(guard.meta.locale);
      after(async () => {
        for (const [customerId, membership] of targets) {
          const locale = fromDbLocale(membership.locale);
          const planName = pick(locale, membership.plan.nameEn, membership.plan.nameFr);
          const token = encodeURIComponent(createPortalToken(customerId));
          await sendPortalLinkEmail(
            email,
            membership.payerName,
            locale,
            `${SITE_URL}${pagePrefix}/membership/manage?token=${token}`,
            membership.recipientName
              ? `${planName} (${membership.recipientName})`
              : planName,
          );
        }
      });
    }
    return { ok: true };
  } catch (error) {
    reportError(error, "public.requestPortalLink");
    return { ok: false, error: "server" };
  }
}
