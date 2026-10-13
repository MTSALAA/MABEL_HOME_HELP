"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { toCsv } from "@/lib/csv";
import { emptyToNull } from "@/lib/utils";
import {
  INVALID,
  isId,
  notesSchema,
  type AdminResult,
} from "@/lib/validation/admin";
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
  const next = REQUEST_STATUSES.find((value) => value === status);
  if (!isId(id) || !next) return { ok: false, error: INVALID };

  await prisma.bookingRequest.update({ where: { id }, data: { status: next } });
  refresh();
  return { ok: true };
}

export async function updateRequestNotes(
  id: string,
  values: unknown,
): Promise<AdminResult> {
  await requireAdmin();
  const parsed = notesSchema.safeParse(values);
  if (!isId(id)) return { ok: false, error: INVALID };
  if (!parsed.success) return { ok: false, error: "The note is too long." };

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
  const rows = await prisma.bookingRequest.findMany({
    where: requestWhere(filters),
    include: {
      service: { select: { titleEn: true } },
      plan: { select: { nameEn: true } },
    },
    orderBy: { createdAt: "desc" },
    take: EXPORT_LIMIT,
  });

  const csv = toCsv(
    [
      "Received",
      "Type",
      "Status",
      "Name",
      "Phone",
      "Email",
      "Requesting for",
      "Service",
      "Plan",
      "Area",
      "Contact by",
      "Preferred time",
      "Message",
      "Language",
      "Admin notes",
    ],
    rows.map((row) => [
      row.createdAt,
      row.type,
      row.status,
      row.fullName,
      row.phone,
      row.email,
      row.requesterRole,
      row.service?.titleEn,
      row.plan?.nameEn,
      row.area,
      row.contactMethod,
      row.preferredTime,
      row.message,
      row.locale,
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
  const next = SPONSOR_STATUSES.find((value) => value === status);
  if (!isId(id) || !next) return { ok: false, error: INVALID };

  await prisma.sponsorInquiry.update({ where: { id }, data: { status: next } });
  refresh();
  return { ok: true };
}

export async function updateSponsorNotes(
  id: string,
  values: unknown,
): Promise<AdminResult> {
  await requireAdmin();
  const parsed = notesSchema.safeParse(values);
  if (!isId(id)) return { ok: false, error: INVALID };
  if (!parsed.success) return { ok: false, error: "The note is too long." };

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
  const rows = await prisma.sponsorInquiry.findMany({
    where: sponsorWhere(filters),
    orderBy: { createdAt: "desc" },
    take: EXPORT_LIMIT,
  });

  const csv = toCsv(
    [
      "Received",
      "Status",
      "Name",
      "Email",
      "Phone",
      "Organization",
      "Wants to",
      "Message",
      "Language",
      "Admin notes",
    ],
    rows.map((row) => [
      row.createdAt,
      row.status,
      row.fullName,
      row.email,
      row.phone,
      row.organization,
      row.intent,
      row.message,
      row.locale,
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
  const parsed = notesSchema.safeParse(values);
  if (!isId(id)) return { ok: false, error: INVALID };
  if (!parsed.success) return { ok: false, error: "The note is too long." };

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
  if (!isId(id)) return { ok: false, error: INVALID };
  const membership = await prisma.membership.findUnique({ where: { id } });
  if (!membership?.stripeSubscriptionId) {
    return { ok: false, error: "This membership has no Stripe subscription." };
  }
  if (membership.status === "CANCELED") {
    return { ok: false, error: "This membership has already ended." };
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
    return {
      ok: false,
      error: "Stripe could not schedule the cancellation. Try again or use the Stripe dashboard.",
    };
  }
}

export async function exportMembersCsv(filters: ListFilters): Promise<CsvResult> {
  await requireAdmin();
  const rows = await prisma.membership.findMany({
    where: membershipWhere(filters),
    include: { plan: { select: { nameEn: true } } },
    orderBy: { createdAt: "desc" },
    take: EXPORT_LIMIT,
  });

  const csv = toCsv(
    [
      "Started",
      "Status",
      "Plan",
      "Payer",
      "Payer phone",
      "Payer email",
      "Visits for",
      "Recipient",
      "Recipient phone",
      "Address",
      "Area",
      "Next billing",
      "Cancels at period end",
      "Language",
      "Sign-up notes",
      "Admin notes",
    ],
    rows.map((row) => [
      row.createdAt,
      row.status,
      row.plan.nameEn,
      row.payerName,
      row.payerPhone,
      row.payerEmail,
      row.requesterRole,
      row.recipientName,
      row.recipientPhone,
      row.serviceAddress,
      row.area,
      row.currentPeriodEnd,
      row.cancelAtPeriodEnd,
      row.locale,
      row.notes,
      row.adminNotes,
    ]),
  );
  return { ok: true, csv, filename: `mabel-members-${today()}.csv` };
}
