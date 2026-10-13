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
    // Emails to the team use the language chosen in the admin settings.
    staffLocale: settings ? fromDbLocale(settings.staffLocale) : "en",
  } as const;
}

function staffTranslator(locale: AppLocale) {
  return createTranslator({
    locale,
    messages: MESSAGES[locale],
    namespace: "Emails.staff",
  });
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

/** Shared frame for emails sent to the team, in the staff language. */
function ownerContent(
  locale: AppLocale,
  heading: string,
  paragraphs: string[],
  details: { label: string; value: string | null | undefined }[],
  cta: { label: string; url: string },
): EmailContent {
  return {
    lang: locale,
    preview: heading,
    heading,
    paragraphs,
    details: details
      .filter((row) => row.value && row.value.trim() !== "")
      .map((row) => ({ label: row.label, value: row.value as string })),
    cta,
    footer: staffTranslator(locale)("footer"),
  };
}

export async function sendRequestEmails(
  request: BookingRequest,
  related: { serviceTitle: string | null; planName: string | null },
): Promise<void> {
  const contact = await getBusinessContact();
  const isBooking = request.type === "BOOKING";
  const staff = staffTranslator(contact.staffLocale);

  await sendEmail({

    kind: "request.owner",
    to: contact.ownerRecipients,
    subject: staff(isBooking ? "request.subjectBooking" : "request.subjectMessage", {
      name: request.fullName,
    }),
    replyTo: request.email ?? undefined,
    content: ownerContent(
      contact.staffLocale,
      staff(isBooking ? "request.headingBooking" : "request.headingMessage"),
      [
        staff(isBooking ? "request.bodyBooking" : "request.bodyMessage", {
          name: request.fullName,
        }),
      ],
      [
        { label: staff("labels.name"), value: request.fullName },
        { label: staff("labels.phone"), value: formatPhone(request.phone) },
        { label: staff("labels.email"), value: request.email },
        {
          label: staff("labels.requestingFor"),
          value: request.requesterRole ? staff(`role.${request.requesterRole}`) : null,
        },
        { label: staff("labels.service"), value: related.serviceTitle },
        { label: staff("labels.plan"), value: related.planName },
        { label: staff("labels.area"), value: request.area },
        {
          label: staff("labels.contactBy"),
          value: request.contactMethod ? staff(`contact.${request.contactMethod}`) : null,
        },
        { label: staff("labels.preferredTime"), value: request.preferredTime },
        { label: staff("labels.message"), value: request.message },
        { label: staff("labels.language"), value: staff(`languageName.${request.locale}`) },
      ],
      { label: staff("openInAdmin"), url: `${SITE_URL}/admin/requests/${request.id}` },
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
  const staff = staffTranslator(contact.staffLocale);

  await sendEmail({

    kind: "sponsor.owner",
    to: contact.ownerRecipients,
    subject: staff("sponsor.subject", { name: inquiry.fullName }),
    replyTo: inquiry.email,
    content: ownerContent(
      contact.staffLocale,
      staff("sponsor.heading"),
      [staff("sponsor.body", { name: inquiry.fullName })],
      [
        { label: staff("labels.name"), value: inquiry.fullName },
        { label: staff("labels.email"), value: inquiry.email },
        {
          label: staff("labels.phone"),
          value: inquiry.phone ? formatPhone(inquiry.phone) : null,
        },
        { label: staff("labels.organization"), value: inquiry.organization },
        { label: staff("labels.wantsTo"), value: staff(`intent.${inquiry.intent}`) },
        { label: staff("labels.message"), value: inquiry.message },
        { label: staff("labels.language"), value: staff(`languageName.${inquiry.locale}`) },
      ],
      { label: staff("openInAdmin"), url: `${SITE_URL}/admin/sponsors/${inquiry.id}` },
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

function membershipOwnerDetails(
  locale: AppLocale,
  membership: Membership,
  plan: Plan,
) {
  const staff = staffTranslator(locale);
  return [
    { label: staff("labels.plan"), value: pick(locale, plan.nameEn, plan.nameFr) },
    { label: staff("labels.payer"), value: membership.payerName },
    { label: staff("labels.payerPhone"), value: formatPhone(membership.payerPhone) },
    { label: staff("labels.payerEmail"), value: membership.payerEmail },
    {
      label: staff("labels.visitsFor"),
      value:
        membership.requesterRole === "SELF"
          ? staff("labels.thePayer")
          : (membership.recipientName ?? staff(`role.${membership.requesterRole}`)),
    },
    {
      label: staff("labels.recipientPhone"),
      value: membership.recipientPhone ? formatPhone(membership.recipientPhone) : null,
    },
    { label: staff("labels.address"), value: membership.serviceAddress },
    { label: staff("labels.area"), value: membership.area },
    { label: staff("labels.notes"), value: membership.notes },
    { label: staff("labels.language"), value: staff(`languageName.${membership.locale}`) },
  ];
}

/** Name and plan as the team reads them, for the subject and first line. */
function membershipStaffWords(locale: AppLocale, membership: Membership, plan: Plan) {
  return { name: membership.payerName, plan: pick(locale, plan.nameEn, plan.nameFr) };
}

export async function sendMembershipActivatedEmails(
  membership: Membership,
  plan: Plan,
): Promise<void> {
  const contact = await getBusinessContact();
  const staff = staffTranslator(contact.staffLocale);
  const words = membershipStaffWords(contact.staffLocale, membership, plan);
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
    subject: staff("member.subject", words),
    replyTo: membership.payerEmail,
    content: ownerContent(
      contact.staffLocale,
      staff("member.heading"),
      [staff("member.body", words)],
      membershipOwnerDetails(contact.staffLocale, membership, plan),
      { label: staff("openInAdmin"), url: `${SITE_URL}/admin/members/${membership.id}` },
    ),
  });
}

export async function sendPaymentFailedEmails(
  membership: Membership,
  plan: Plan,
): Promise<void> {
  const contact = await getBusinessContact();
  const staff = staffTranslator(contact.staffLocale);
  const words = membershipStaffWords(contact.staffLocale, membership, plan);
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
    subject: staff("paymentFailed.subject", words),
    content: ownerContent(
      contact.staffLocale,
      staff("paymentFailed.heading"),
      [staff("paymentFailed.body", words)],
      membershipOwnerDetails(contact.staffLocale, membership, plan).slice(0, 4),
      { label: staff("openInAdmin"), url: `${SITE_URL}/admin/members/${membership.id}` },
    ),
  });
}

export async function sendMembershipCanceledEmail(
  membership: Membership,
  plan: Plan,
): Promise<void> {
  const contact = await getBusinessContact();
  const staff = staffTranslator(contact.staffLocale);
  const words = membershipStaffWords(contact.staffLocale, membership, plan);
  await sendEmail({
    kind: "membership.ended.owner",
    to: contact.ownerRecipients,
    subject: staff("ended.subject", words),
    content: ownerContent(
      contact.staffLocale,
      staff("ended.heading"),
      [staff("ended.body", words)],
      membershipOwnerDetails(contact.staffLocale, membership, plan).slice(0, 4),
      { label: staff("openInAdmin"), url: `${SITE_URL}/admin/members/${membership.id}` },
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
  const staff = staffTranslator(contact.staffLocale);
  await sendEmail({
    kind: "membership.unmatched.owner",
    to: contact.ownerRecipients,
    subject: staff("unmatched.subject"),
    content: ownerContent(
      contact.staffLocale,
      staff("unmatched.heading"),
      [staff("unmatched.body1"), staff("unmatched.body2")],
      [
        { label: staff("labels.customerEmail"), value: payment.customerEmail },
        { label: staff("labels.stripeCustomer"), value: payment.customerId },
        { label: staff("labels.stripeSubscription"), value: payment.subscriptionId },
        { label: staff("labels.checkoutSession"), value: payment.sessionId },
      ],
      { label: staff("unmatched.openStripe"), url: "https://dashboard.stripe.com/subscriptions" },
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
  const { staffLocale } = await getBusinessContact();
  const staff = staffTranslator(staffLocale);
  const key = kind === "invite" ? "invite" : "reset";
  await sendEmail({
    kind: "admin.password",
    to: email,
    subject: staff(`password.${key}Subject`),
    content: {
      lang: staffLocale,
      preview: staff(`password.${key}Preview`),
      heading: staff(`password.${key}Heading`),
      paragraphs: [staff(`password.${key}Body`)],
      cta: { label: staff(`password.${key}Cta`), url },
      afterCta: [staff("password.expiry")],
      footer: staff("footer"),
    },
  });
}
