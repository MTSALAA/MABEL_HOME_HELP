import type {
  BookingRequest,
  Membership,
  Plan,
  SponsorInquiry,
} from "@prisma/client";
import { createTranslator } from "next-intl";
import en from "../../../messages/en.json";
import fr from "../../../messages/fr.json";
import type { AppLocale } from "@/i18n/routing";
import { SITE_URL } from "@/lib/constants";
import { formatDate, fromDbLocale } from "@/lib/locale";
import { pick } from "@/lib/localize";
import { formatCad } from "@/lib/money";
import { formatPhone } from "@/lib/phone";
import { prisma } from "@/server/db";
import type { EmailContent } from "./layout";
import { sendEmail } from "./send";

const MESSAGES = { en, fr } as const;

function translator(locale: AppLocale) {
  return createTranslator({
    locale,
    messages: MESSAGES[locale],
    namespace: "Emails",
  });
}

async function getBusinessContact() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  const recipients =
    settings && settings.notificationEmails.length > 0
      ? settings.notificationEmails
      : settings?.email
        ? [settings.email]
        : [];
  return {
    ownerRecipients: recipients,
    phone: settings?.phone ? formatPhone(settings.phone) : null,
    replyTo: settings?.email ?? undefined,
  };
}

/** Shared frame for emails sent to visitors and members, in their language. */
function visitorContent(
  locale: AppLocale,
  name: string,
  phone: string | null,
  body: Pick<EmailContent, "heading" | "paragraphs" | "details" | "cta" | "afterCta">,
): EmailContent {
  const t = translator(locale);
  const afterCta = [...(body.afterCta ?? [])];
  if (phone) afterCta.push(t("callUs", { phone }));
  return {
    lang: locale,
    preview: body.heading,
    heading: body.heading,
    paragraphs: [t("greeting", { name }), ...body.paragraphs],
    details: body.details,
    cta: body.cta,
    afterCta,
    signoff: [t("signoff"), t("team")],
    footer: t("footer"),
  };
}

/** Owner notifications are always in English. */
function ownerContent(
  heading: string,
  paragraphs: string[],
  details: { label: string; value: string | null | undefined }[],
  cta: { label: string; url: string },
): EmailContent {
  return {
    lang: "en",
    preview: heading,
    heading,
    paragraphs,
    details: details
      .filter((row) => row.value && row.value.trim() !== "")
      .map((row) => ({ label: row.label, value: row.value as string })),
    cta,
    footer: "Sent by the Mabel Home Help website.",
  };
}

const ROLE_LABEL = {
  SELF: "Themselves",
  FAMILY: "A family member",
  OTHER: "Someone else",
} as const;

const CONTACT_LABEL = { CALL: "Call", TEXT: "Text", EMAIL: "Email" } as const;

const INTENT_LABEL = {
  SPONSOR_VISITS: "Sponsor visits",
  NOMINATE_SENIOR: "Nominate a senior in need",
  OTHER: "Other",
} as const;

export async function sendRequestEmails(
  request: BookingRequest,
  related: { serviceTitle: string | null; planName: string | null },
): Promise<void> {
  const contact = await getBusinessContact();
  const isBooking = request.type === "BOOKING";

  await sendEmail({

    kind: "request.owner",
    to: contact.ownerRecipients,
    subject: isBooking
      ? `New service request from ${request.fullName}`
      : `New message from ${request.fullName}`,
    replyTo: request.email ?? undefined,
    content: ownerContent(
      isBooking ? "New service request" : "New contact message",
      [`${request.fullName} sent a ${isBooking ? "service request" : "message"} through the website.`],
      [
        { label: "Name", value: request.fullName },
        { label: "Phone", value: formatPhone(request.phone) },
        { label: "Email", value: request.email },
        {
          label: "Requesting for",
          value: request.requesterRole ? ROLE_LABEL[request.requesterRole] : null,
        },
        { label: "Service", value: related.serviceTitle },
        { label: "Plan", value: related.planName },
        { label: "Area", value: request.area },
        {
          label: "Contact by",
          value: request.contactMethod ? CONTACT_LABEL[request.contactMethod] : null,
        },
        { label: "Preferred time", value: request.preferredTime },
        { label: "Message", value: request.message },
        { label: "Language", value: request.locale === "FR" ? "French" : "English" },
      ],
      { label: "Open in admin", url: `${SITE_URL}/admin/requests/${request.id}` },
    ),
  });

  if (request.email) {
    const locale = fromDbLocale(request.locale);
    const t = translator(locale);
    const key = isBooking ? "requestConfirm" : "contactConfirm";
    await sendEmail({
      kind: "request.visitor",
      to: request.email,
      subject: t(`${key}.subject`),
      replyTo: contact.replyTo,
      content: visitorContent(locale, request.fullName, contact.phone, {
        heading: t(`${key}.heading`),
        paragraphs: isBooking
          ? [t("requestConfirm.body"), t("requestConfirm.urgent")]
          : [t("contactConfirm.body")],
      }),
    });
  }
}

export async function sendSponsorEmails(inquiry: SponsorInquiry): Promise<void> {
  const contact = await getBusinessContact();

  await sendEmail({

    kind: "sponsor.owner",
    to: contact.ownerRecipients,
    subject: `New Sponsor a Senior inquiry from ${inquiry.fullName}`,
    replyTo: inquiry.email,
    content: ownerContent(
      "New Sponsor a Senior inquiry",
      [`${inquiry.fullName} would like to talk about Sponsor a Senior.`],
      [
        { label: "Name", value: inquiry.fullName },
        { label: "Email", value: inquiry.email },
        { label: "Phone", value: inquiry.phone ? formatPhone(inquiry.phone) : null },
        { label: "Organization", value: inquiry.organization },
        { label: "Wants to", value: INTENT_LABEL[inquiry.intent] },
        { label: "Message", value: inquiry.message },
        { label: "Language", value: inquiry.locale === "FR" ? "French" : "English" },
      ],
      { label: "Open in admin", url: `${SITE_URL}/admin/sponsors/${inquiry.id}` },
    ),
  });

  const locale = fromDbLocale(inquiry.locale);
  const t = translator(locale);
  await sendEmail({
    kind: "sponsor.visitor",
    to: inquiry.email,
    subject: t("sponsorConfirm.subject"),
    replyTo: contact.replyTo,
    content: visitorContent(locale, inquiry.fullName, contact.phone, {
      heading: t("sponsorConfirm.heading"),
      paragraphs: [t("sponsorConfirm.body")],
    }),
  });
}

function membershipOwnerDetails(membership: Membership, plan: Plan) {
  return [
    { label: "Plan", value: plan.nameEn },
    { label: "Payer", value: membership.payerName },
    { label: "Payer phone", value: formatPhone(membership.payerPhone) },
    { label: "Payer email", value: membership.payerEmail },
    {
      label: "Visits are for",
      value:
        membership.requesterRole === "SELF"
          ? "The payer"
          : (membership.recipientName ?? ROLE_LABEL[membership.requesterRole]),
    },
    {
      label: "Recipient phone",
      value: membership.recipientPhone ? formatPhone(membership.recipientPhone) : null,
    },
    { label: "Address", value: membership.serviceAddress },
    { label: "Area", value: membership.area },
    { label: "Notes", value: membership.notes },
    { label: "Language", value: membership.locale === "FR" ? "French" : "English" },
  ];
}

export async function sendMembershipActivatedEmails(
  membership: Membership,
  plan: Plan,
): Promise<void> {
  const contact = await getBusinessContact();
  const locale = fromDbLocale(membership.locale);
  const t = translator(locale);
  const manageUrl = `${SITE_URL}${locale === "fr" ? "/fr" : ""}/membership/manage`;

  const details = [
    { label: t("welcome.plan"), value: pick(locale, plan.nameEn, plan.nameFr) },
  ];
  if (plan.monthlyCents !== null) {
    details.push({
      label: t("welcome.amount"),
      value: formatCad(plan.monthlyCents, locale),
    });
  }
  if (membership.currentPeriodEnd) {
    details.push({
      label: t("welcome.nextBilling"),
      value: formatDate(membership.currentPeriodEnd, locale),
    });
  }

  await sendEmail({

    kind: "membership.welcome",
    to: membership.payerEmail,
    subject: t("welcome.subject"),
    replyTo: contact.replyTo,
    content: visitorContent(locale, membership.payerName, contact.phone, {
      heading: t("welcome.heading"),
      paragraphs: [t("welcome.body"), t("welcome.manage")],
      details,
      cta: { label: t("welcome.manageCta"), url: manageUrl },
      afterCta: [t("welcome.receipt")],
    }),
  });

  await sendEmail({

    kind: "membership.owner",
    to: contact.ownerRecipients,
    subject: `New member: ${membership.payerName} (${plan.nameEn})`,
    replyTo: membership.payerEmail,
    content: ownerContent(
      "New membership",
      [
        `${membership.payerName} just joined ${plan.nameEn}. Call within one business day to schedule the first visit.`,
      ],
      membershipOwnerDetails(membership, plan),
      { label: "Open in admin", url: `${SITE_URL}/admin/members/${membership.id}` },
    ),
  });
}

export async function sendPaymentFailedEmails(
  membership: Membership,
  plan: Plan,
): Promise<void> {
  const contact = await getBusinessContact();
  const locale = fromDbLocale(membership.locale);
  const t = translator(locale);
  const manageUrl = `${SITE_URL}${locale === "fr" ? "/fr" : ""}/membership/manage`;

  await sendEmail({

    kind: "paymentFailed.member",
    to: membership.payerEmail,
    subject: t("paymentFailed.subject"),
    replyTo: contact.replyTo,
    content: visitorContent(locale, membership.payerName, contact.phone, {
      heading: t("paymentFailed.heading"),
      paragraphs: [
        t("paymentFailed.body", { plan: pick(locale, plan.nameEn, plan.nameFr) }),
        t("paymentFailed.action"),
      ],
      cta: { label: t("paymentFailed.cta"), url: manageUrl },
    }),
  });

  await sendEmail({

    kind: "paymentFailed.owner",
    to: contact.ownerRecipients,
    subject: `Payment failed: ${membership.payerName} (${plan.nameEn})`,
    content: ownerContent(
      "Membership payment failed",
      [
        `The card payment for ${membership.payerName}'s ${plan.nameEn} membership failed. Stripe will retry automatically, and the member has been asked to update their card.`,
      ],
      membershipOwnerDetails(membership, plan).slice(0, 4),
      { label: "Open in admin", url: `${SITE_URL}/admin/members/${membership.id}` },
    ),
  });
}

export async function sendMembershipCanceledEmail(
  membership: Membership,
  plan: Plan,
): Promise<void> {
  const contact = await getBusinessContact();
  await sendEmail({
    kind: "membership.ended.owner",
    to: contact.ownerRecipients,
    subject: `Membership ended: ${membership.payerName} (${plan.nameEn})`,
    content: ownerContent(
      "Membership ended",
      [`${membership.payerName}'s ${plan.nameEn} membership has ended. No further payments will be taken.`],
      membershipOwnerDetails(membership, plan).slice(0, 4),
      { label: "Open in admin", url: `${SITE_URL}/admin/members/${membership.id}` },
    ),
  });
}

/**
 * A checkout was paid but no membership record matches it. The customer is
 * being billed, so the owner has to hear about it and sort it out in Stripe.
 */
export async function sendUnmatchedPaymentAlert(payment: {
  sessionId: string;
  subscriptionId: string;
  customerId: string | null;
  customerEmail: string | null;
}): Promise<void> {
  const contact = await getBusinessContact();
  await sendEmail({
    kind: "membership.unmatched.owner",
    to: contact.ownerRecipients,
    subject: "Action needed: a membership payment has no sign-up record",
    content: ownerContent(
      "A payment needs your attention",
      [
        "Stripe reports a paid membership checkout, but the website has no sign-up record for it. The customer is being billed and does not appear in the Members list.",
        "Open the customer in Stripe, contact them for their visit details, and either add them by hand or cancel and refund the subscription.",
      ],
      [
        { label: "Customer email", value: payment.customerEmail },
        { label: "Stripe customer", value: payment.customerId },
        { label: "Stripe subscription", value: payment.subscriptionId },
        { label: "Checkout session", value: payment.sessionId },
      ],
      { label: "Open Stripe", url: "https://dashboard.stripe.com/subscriptions" },
    ),
  });
}

export async function sendPortalLinkEmail(
  email: string,
  name: string,
  locale: AppLocale,
  url: string,
  membershipLabel: string,
): Promise<void> {
  const contact = await getBusinessContact();
  const t = translator(locale);
  await sendEmail({
    kind: "portalLink",
    to: email,
    subject: t("portalLink.subject"),
    replyTo: contact.replyTo,
    content: visitorContent(locale, name, contact.phone, {
      heading: t("portalLink.heading"),
      paragraphs: [t("portalLink.body")],
      details: [{ label: t("welcome.plan"), value: membershipLabel }],
      cta: { label: t("portalLink.cta"), url },
      afterCta: [t("portalLink.ignore")],
    }),
  });
}

export async function sendAdminPasswordEmail(
  email: string,
  url: string,
  kind: "reset" | "invite",
): Promise<void> {
  const isInvite = kind === "invite";
  await sendEmail({
    kind: "admin.password",
    to: email,
    subject: isInvite
      ? "You've been invited to the Mabel Home Help admin"
      : "Reset your Mabel Home Help admin password",
    content: {
      lang: "en",
      preview: isInvite ? "Set your password to get started." : "Reset your password.",
      heading: isInvite ? "Set up your admin account" : "Reset your password",
      paragraphs: [
        isInvite
          ? "You've been given access to the Mabel Home Help admin dashboard. Choose a password to get started."
          : "We received a request to reset the password for your admin account.",
      ],
      cta: { label: isInvite ? "Choose my password" : "Reset my password", url },
      afterCta: [
        "This link works for one hour. If you didn't expect this email, you can ignore it.",
      ],
      footer: "Sent by the Mabel Home Help website.",
    },
  });
}
