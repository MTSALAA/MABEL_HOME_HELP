"use server";

import { refresh, updateTag } from "next/cache";
import { CONTENT_TAG } from "@/lib/constants";
import { parseDollarsToCents } from "@/lib/money";
import { normalizePhone } from "@/lib/phone";
import { emptyToNull } from "@/lib/utils";
import {
  planSchema,
  serviceSchema,
  settingsSchema,
  INVALID,
  isId,
  isIdList,
  toFieldErrors,
  type AdminResult,
} from "@/lib/validation/admin";
import { prisma } from "@/server/db";
import { reportError } from "@/server/report-error";
import { requireAdmin } from "@/server/session";
import { isStripeEnabled, syncPlanWithStripe } from "@/server/stripe";

/** Expires the public content cache so edits appear on the site right away. */
function publish() {
  updateTag(CONTENT_TAG);
  refresh();
}

const CHECK_FORM = "Please check the highlighted fields.";

// --- Services -----------------------------------------------------------------

export async function saveService(
  id: string | null,
  values: unknown,
): Promise<AdminResult<{ id?: string }>> {
  await requireAdmin();
  if (id !== null && !isId(id)) return { ok: false, error: INVALID };
  const parsed = serviceSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: CHECK_FORM, fieldErrors: toFieldErrors(parsed.error) };
  }
  const data = parsed.data;

  const clash = await prisma.service.findFirst({
    where: { slug: data.slug, ...(id ? { NOT: { id } } : {}) },
    select: { id: true },
  });
  if (clash) {
    return {
      ok: false,
      error: CHECK_FORM,
      fieldErrors: { slug: "Another service already uses this slug." },
    };
  }

  const fields = {
    slug: data.slug,
    titleEn: data.titleEn,
    titleFr: emptyToNull(data.titleFr),
    descriptionEn: data.descriptionEn,
    descriptionFr: emptyToNull(data.descriptionFr),
    illustration: data.illustration,
    imageUrl: emptyToNull(data.imageUrl),
    isActive: data.isActive,
    isFeatured: data.isFeatured,
  };

  let savedId = id;
  if (id) {
    await prisma.service.update({ where: { id }, data: fields });
  } else {
    const last = await prisma.service.aggregate({ _max: { sortOrder: true } });
    const created = await prisma.service.create({
      data: { ...fields, sortOrder: (last._max.sortOrder ?? -1) + 1 },
    });
    savedId = created.id;
  }

  publish();
  return { ok: true, id: savedId ?? undefined };
}

export async function setServiceFlag(
  id: string,
  flag: string,
  value: boolean,
): Promise<AdminResult> {
  await requireAdmin();
  if (!isId(id) || typeof value !== "boolean") return { ok: false, error: INVALID };
  if (flag !== "isActive" && flag !== "isFeatured") {
    return { ok: false, error: INVALID };
  }
  await prisma.service.update({ where: { id }, data: { [flag]: value } });
  publish();
  return { ok: true };
}

export async function reorderServices(orderedIds: string[]): Promise<AdminResult> {
  await requireAdmin();
  if (!isIdList(orderedIds)) {
    return { ok: false, error: "Could not save the new order." };
  }
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.service.update({ where: { id }, data: { sortOrder: index } }),
    ),
  );
  publish();
  return { ok: true };
}

/**
 * Deletes a service, or only hides it when requests still point at it so
 * their history stays readable.
 */
export async function deleteService(
  id: string,
): Promise<AdminResult<{ hidden?: boolean }>> {
  await requireAdmin();
  if (!isId(id)) return { ok: false, error: INVALID };
  const referenced = await prisma.bookingRequest.count({ where: { serviceId: id } });
  if (referenced > 0) {
    await prisma.service.update({ where: { id }, data: { isActive: false } });
    publish();
    return { ok: true, hidden: true };
  }
  await prisma.service.delete({ where: { id } });
  publish();
  return { ok: true, hidden: false };
}

// --- Plans --------------------------------------------------------------------

export async function savePlan(
  id: string | null,
  values: unknown,
): Promise<AdminResult<{ id?: string; warning?: string }>> {
  await requireAdmin();
  if (id !== null && !isId(id)) return { ok: false, error: INVALID };
  const parsed = planSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: CHECK_FORM, fieldErrors: toFieldErrors(parsed.error) };
  }
  const data = parsed.data;

  const clash = await prisma.plan.findFirst({
    where: { slug: data.slug, ...(id ? { NOT: { id } } : {}) },
    select: { id: true },
  });
  if (clash) {
    return {
      ok: false,
      error: CHECK_FORM,
      fieldErrors: { slug: "Another plan already uses this slug." },
    };
  }

  const fields = {
    slug: data.slug,
    nameEn: data.nameEn,
    nameFr: emptyToNull(data.nameFr),
    priceTextEn: data.priceTextEn,
    priceTextFr: emptyToNull(data.priceTextFr),
    includesEn: data.includesEn,
    includesFr: emptyToNull(data.includesFr),
    noteEn: emptyToNull(data.noteEn),
    noteFr: emptyToNull(data.noteFr),
    isActive: data.isActive,
    isHighlighted: data.isHighlighted,
    isPurchasable: data.isPurchasable,
    monthlyCents: data.isPurchasable
      ? parseDollarsToCents(data.monthlyAmount)
      : null,
  };

  let plan;
  if (id) {
    plan = await prisma.plan.update({ where: { id }, data: fields });
  } else {
    const last = await prisma.plan.aggregate({ _max: { sortOrder: true } });
    plan = await prisma.plan.create({
      data: { ...fields, sortOrder: (last._max.sortOrder ?? -1) + 1 },
    });
  }

  // Keep Stripe in step: the owner never has to open Stripe to set a price.
  let warning: string | undefined;
  if (plan.isPurchasable) {
    if (!isStripeEnabled()) {
      warning =
        "Saved. Stripe is not fully connected yet, so this plan can't be bought online until it is. Save the plan again afterwards.";
    } else {
      try {
        const synced = await syncPlanWithStripe(plan);
        if (synced) {
          await prisma.plan.update({ where: { id: plan.id }, data: synced });
        }
      } catch (error) {
        reportError(error, "admin.savePlan.stripe");
        // The amount shown may no longer match the old Stripe price. Clearing
        // the price takes the plan off sale rather than charging the old one.
        await prisma.plan.update({
          where: { id: plan.id },
          data: { stripePriceId: null },
        });
        warning =
          "Saved, but Stripe could not create the price. The plan can't be bought online until you save it again successfully.";
      }
    }
  }

  publish();
  return { ok: true, id: plan.id, warning };
}

export async function setPlanFlag(
  id: string,
  flag: string,
  value: boolean,
): Promise<AdminResult> {
  await requireAdmin();
  if (!isId(id) || typeof value !== "boolean") return { ok: false, error: INVALID };
  if (flag !== "isActive" && flag !== "isHighlighted") {
    return { ok: false, error: INVALID };
  }
  await prisma.plan.update({ where: { id }, data: { [flag]: value } });
  publish();
  return { ok: true };
}

export async function reorderPlans(orderedIds: string[]): Promise<AdminResult> {
  await requireAdmin();
  if (!isIdList(orderedIds)) {
    return { ok: false, error: "Could not save the new order." };
  }
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.plan.update({ where: { id }, data: { sortOrder: index } }),
    ),
  );
  publish();
  return { ok: true };
}

/**
 * A plan that anything still points at is only hidden, never deleted: members
 * (including a checkout that may be mid-payment) and requests that named it.
 */
export async function deletePlan(
  id: string,
): Promise<AdminResult<{ hidden?: boolean }>> {
  await requireAdmin();
  if (!isId(id)) return { ok: false, error: INVALID };

  const [memberships, requests] = await Promise.all([
    prisma.membership.count({ where: { planId: id } }),
    prisma.bookingRequest.count({ where: { planId: id } }),
  ]);
  if (memberships > 0 || requests > 0) {
    await prisma.plan.update({ where: { id }, data: { isActive: false } });
    publish();
    return { ok: true, hidden: true };
  }
  await prisma.plan.delete({ where: { id } });
  publish();
  return { ok: true, hidden: false };
}

// --- Settings -----------------------------------------------------------------

export async function saveSettings(values: unknown): Promise<AdminResult> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: CHECK_FORM, fieldErrors: toFieldErrors(parsed.error) };
  }
  const data = parsed.data;

  const fields = {
    businessName: data.businessName,
    taglineEn: data.taglineEn,
    taglineFr: emptyToNull(data.taglineFr),
    phone: data.phone ? normalizePhone(data.phone) : null,
    email: data.email ? data.email.toLowerCase() : null,
    location: data.location,
    serviceAreasEn: data.serviceAreasEn,
    serviceAreasFr: data.serviceAreasFr,
    hoursEn: emptyToNull(data.hoursEn),
    hoursFr: emptyToNull(data.hoursFr),
    disclaimerEn: data.disclaimerEn,
    disclaimerFr: emptyToNull(data.disclaimerFr),
    notificationEmails: data.notificationEmails.map((email) => email.toLowerCase()),
  };

  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: fields,
    create: { id: 1, ...fields },
  });

  publish();
  return { ok: true };
}
