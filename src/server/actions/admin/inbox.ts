"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { toCsv } from "@/lib/csv";
import { pick } from "@/lib/localize";
import { emptyToNull } from "@/lib/utils";
import { isId, notesSchema, type AdminResult } from "@/lib/validation/admin";
import {
  getAdminFormat,
  getAdminLabels,
  getAdminLocale,
  getAdminT,
} from "@/server/admin-i18n";
import { prisma } from "@/server/db";
import {
  membershipWhere,
  REQUEST_STATUSES,
  requestWhere,
  SPONSOR_STATUSES,
  sponsorWhere,
  type ListFilters,
} from "@/server/queries/admin";
import { reportError } from "@/server/report-error";
import { requireAdmin } from "@/server/session";
import { cancelSubscriptionAtPeriodEnd, getPeriodEnd } from "@/server/stripe";

const EXPORT_LIMIT = 5000;

type CsvResult = AdminResult<{ csv?: string; filename?: string }>;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// --- Booking requests ---------------------------------------------------------

export async function updateRequestStatus(
  id: string,
  status: string,
): Promise<AdminResult> {
  await requireAdmin();
  const t = await getAdminT("Common");
  const next = REQUEST_STATUSES.find((value) => value === status);
  if (!isId(id) || !next) return { ok: false, error: t("invalidRequest") };

  await prisma.bookingRequest.update({ where: { id }, data: { status: next } });
  refresh();
  return { ok: true };
}

export async function updateRequestNotes(
  id: string,
  values: unknown,
): Promise<AdminResult> {
  await requireAdmin();
  const t = await getAdminT("Common");
  const parsed = notesSchema.safeParse(values);
  if (!isId(id)) return { ok: false, error: t("invalidRequest") };
  if (!parsed.success) return { ok: false, error: t("noteTooLong") };

  await prisma.bookingRequest.update({
    where: { id },
    data: { adminNotes: emptyToNull(parsed.data.notes) },
  });
  refresh();
  return { ok: true };
}

/** Permanent deletion, used to honour privacy removal requests. */
export async function deleteRequest(id: string): Promise<void> {
  await requireAdmin();
  // deleteMany: a request someone else already removed is not an error.
  if (isId(id)) await prisma.bookingRequest.deleteMany({ where: { id } });
  redirect("/admin/requests");
}

export async function exportRequestsCsv(filters: ListFilters): Promise<CsvResult> {
  await requireAdmin();
  const [t, tCommon, labels, format, locale] = await Promise.all([
    getAdminT("Requests"),
    getAdminT("Common"),
    getAdminLabels(),
    getAdminFormat(),
    getAdminLocale(),
  ]);
  const rows = await prisma.bookingRequest.findMany({
    where: requestWhere(filters),
    include: {
      service: { select: { titleEn: true, titleFr: true } },
      plan: { select: { nameEn: true, nameFr: true } },
    },
    orderBy: { createdAt: "desc" },
    take: EXPORT_LIMIT,
  });

  const csv = toCsv(
    [
      t("fields.received"),
      t("fields.type"),
      tCommon("status"),
      t("fields.name"),
      t("fields.phone"),
      t("fields.email"),
      t("fields.requestingFor"),
      t("fields.service"),
      t("fields.plan"),
      t("fields.area"),
      t("fields.contactBy"),
      t("fields.preferredTime"),
      t("fields.message"),
      t("fields.language"),
      t("fields.adminNotes"),
    ],
    rows.map((row) => [
      format.dateTime(row.createdAt),
      labels(row.type),
      labels(row.status),
      row.fullName,
      row.phone,
      row.email,
      labels(row.requesterRole),
      row.service ? pick(locale, row.service.titleEn, row.service.titleFr) : null,
      row.plan ? pick(locale, row.plan.nameEn, row.plan.nameFr) : null,
      row.area === "OTHER" ? t("areaOther") : row.area,
      labels(row.contactMethod),
      row.preferredTime,
      row.message,
      labels(row.locale),
      row.adminNotes,
    ]),
  );
  return { ok: true, csv, filename: `mabel-requests-${today()}.csv` };
}

// --- Sponsor inquiries --------------------------------------------------------

export async function updateSponsorStatus(
  id: string,
  status: string,
): Promise<AdminResult> {
  await requireAdmin();
  const t = await getAdminT("Common");
  const next = SPONSOR_STATUSES.find((value) => value === status);
  if (!isId(id) || !next) return { ok: false, error: t("invalidRequest") };

  await prisma.sponsorInquiry.update({ where: { id }, data: { status: next } });
  refresh();
  return { ok: true };
}

export async function updateSponsorNotes(
  id: string,
  values: unknown,
): Promise<AdminResult> {
  await requireAdmin();
  const t = await getAdminT("Common");
  const parsed = notesSchema.safeParse(values);
  if (!isId(id)) return { ok: false, error: t("invalidRequest") };
  if (!parsed.success) return { ok: false, error: t("noteTooLong") };

  await prisma.sponsorInquiry.update({
    where: { id },
    data: { adminNotes: emptyToNull(parsed.data.notes) },
  });
  refresh();
  return { ok: true };
}

export async function deleteSponsor(id: string): Promise<void> {
  await requireAdmin();
  if (isId(id)) await prisma.sponsorInquiry.deleteMany({ where: { id } });
  redirect("/admin/sponsors");
}

export async function exportSponsorsCsv(filters: ListFilters): Promise<CsvResult> {
  await requireAdmin();
  const [t, tCommon, labels, format] = await Promise.all([
    getAdminT("Sponsors"),
    getAdminT("Common"),
    getAdminLabels(),
    getAdminFormat(),
  ]);
  const rows = await prisma.sponsorInquiry.findMany({
    where: sponsorWhere(filters),
    orderBy: { createdAt: "desc" },
    take: EXPORT_LIMIT,
  });

  const csv = toCsv(
    [
      t("fields.received"),
      tCommon("status"),
      t("fields.name"),
      t("fields.email"),
      t("fields.phone"),
      t("fields.organization"),
      t("fields.wantsTo"),
      t("fields.message"),
      t("fields.language"),
      t("fields.adminNotes"),
    ],
    rows.map((row) => [
      format.dateTime(row.createdAt),
      labels(row.status),
      row.fullName,
      row.email,
      row.phone,
      row.organization,
      // "OTHER" is also a requester role, whose label does not fit here.
      row.intent === "OTHER" ? t("intentOther") : labels(row.intent),
      row.message,
      labels(row.locale),
      row.adminNotes,
    ]),
  );
  return { ok: true, csv, filename: `mabel-sponsor-inquiries-${today()}.csv` };
}

// --- Memberships --------------------------------------------------------------

export async function updateMembershipNotes(
  id: string,
  values: unknown,
): Promise<AdminResult> {
  await requireAdmin();
  const t = await getAdminT("Common");
  const parsed = notesSchema.safeParse(values);
  if (!isId(id)) return { ok: false, error: t("invalidRequest") };
  if (!parsed.success) return { ok: false, error: t("noteTooLong") };

  await prisma.membership.update({
    where: { id },
    data: { adminNotes: emptyToNull(parsed.data.notes) },
  });
  refresh();
  return { ok: true };
}

/**
 * Schedules cancellation at the end of the paid period. Refunds and immediate
 * cancellation are deliberately left to the Stripe dashboard.
 */
export async function cancelMembership(id: string): Promise<AdminResult> {
  await requireAdmin();
  const [t, tCommon] = await Promise.all([
    getAdminT("Members.errors"),
    getAdminT("Common"),
  ]);
  if (!isId(id)) return { ok: false, error: tCommon("invalidRequest") };
  const membership = await prisma.membership.findUnique({ where: { id } });
  if (!membership?.stripeSubscriptionId) {
    return { ok: false, error: t("noSubscription") };
  }
  if (membership.status === "CANCELED") {
    return { ok: false, error: t("alreadyEnded") };
  }

  try {
    const subscription = await cancelSubscriptionAtPeriodEnd(
      membership.stripeSubscriptionId,
    );
    // The webhook will confirm this; updating now keeps the screen accurate.
    await prisma.membership.update({
      where: { id },
      data: {
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: getPeriodEnd(subscription) ?? membership.currentPeriodEnd,
      },
    });
    refresh();
    return { ok: true };
  } catch (error) {
    reportError(error, "admin.cancelMembership");
    return { ok: false, error: t("stripeFailed") };
  }
}

export async function exportMembersCsv(filters: ListFilters): Promise<CsvResult> {
  await requireAdmin();
  const [t, tCommon, labels, format, locale] = await Promise.all([
    getAdminT("Members"),
    getAdminT("Common"),
    getAdminLabels(),
    getAdminFormat(),
    getAdminLocale(),
  ]);
  const rows = await prisma.membership.findMany({
    where: membershipWhere(filters),
    include: { plan: { select: { nameEn: true, nameFr: true } } },
    orderBy: { createdAt: "desc" },
    take: EXPORT_LIMIT,
  });

  const csv = toCsv(
    [
      t("fields.started"),
      tCommon("status"),
      t("fields.plan"),
      t("fields.payer"),
      t("fields.payerPhone"),
      t("fields.payerEmail"),
      t("fields.visitsFor"),
      t("fields.recipient"),
      t("fields.recipientPhone"),
      t("fields.address"),
      t("fields.area"),
      t("fields.nextBilling"),
      t("fields.cancelsAtPeriodEnd"),
      t("fields.language"),
      t("fields.signUpNotes"),
      t("fields.adminNotes"),
    ],
    rows.map((row) => [
      format.day(row.createdAt),
      labels(row.status),
      pick(locale, row.plan.nameEn, row.plan.nameFr),
      row.payerName,
      row.payerPhone,
      row.payerEmail,
      labels(row.requesterRole),
      row.recipientName,
      row.recipientPhone,
      row.serviceAddress,
      row.area,
      format.day(row.currentPeriodEnd),
      tCommon(row.cancelAtPeriodEnd ? "yes" : "no"),
      labels(row.locale),
      row.notes,
      row.adminNotes,
    ]),
  );
  return { ok: true, csv, filename: `mabel-members-${today()}.csv` };
}
