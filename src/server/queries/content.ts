import type { Plan, Service, SiteSettings } from "@prisma/client";
import { cacheLife, cacheTag } from "next/cache";
import type { AppLocale } from "@/i18n/routing";
import { CONTENT_TAG } from "@/lib/constants";
import {
  localizePlan,
  localizeService,
  localizeSettings,
  type LocalizedPlan,
  type LocalizedService,
  type LocalizedSettings,
} from "@/lib/localize";
import { prisma } from "@/server/db";
import { isStripeEnabled } from "@/server/stripe";

// Used until the database has been seeded, so pages never crash on a new
// environment.
const FALLBACK_SETTINGS: SiteSettings = {
  id: 1,
  businessName: "Mabel Home Help",
  taglineEn: "Small jobs. Friendly visits. Peace of mind.",
  taglineFr: "Petits travaux. Visites amicales. Tranquillité d'esprit.",
  phone: null,
  email: null,
  location: "Edmonton, Alberta, Canada",
  serviceAreasEn: [],
  serviceAreasFr: [],
  hoursEn: null,
  hoursFr: null,
  disclaimerEn:
    "We provide non-medical, non-emergency services only. We do not provide nursing, personal care or emergency response.",
  disclaimerFr:
    "Nous offrons uniquement des services non médicaux et non urgents. Nous n'offrons pas de soins infirmiers, de soins personnels ni d'intervention d'urgence.",
  notificationEmails: [],
  updatedAt: new Date(0),
};

// The raw rows are cached once for both languages and tagged, so a single
// updateTag(CONTENT_TAG) after an admin save refreshes every public page.

async function loadSettings(): Promise<SiteSettings> {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  return settings ?? FALLBACK_SETTINGS;
}

async function loadActiveServices(): Promise<Service[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
  return prisma.service.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

async function loadActivePlans(): Promise<Plan[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
  return prisma.plan.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function getSettings(locale: AppLocale): Promise<LocalizedSettings> {
  return localizeSettings(await loadSettings(), locale);
}

export async function getServices(locale: AppLocale): Promise<LocalizedService[]> {
  const services = await loadActiveServices();
  return services.map((service) => localizeService(service, locale));
}

export async function getPlans(locale: AppLocale): Promise<LocalizedPlan[]> {
  const plans = await loadActivePlans();
  const stripeEnabled = isStripeEnabled();
  return plans.map((plan) => localizePlan(plan, locale, stripeEnabled));
}

export async function getPlanBySlug(
  slug: string,
  locale: AppLocale,
): Promise<LocalizedPlan | null> {
  const plans = await getPlans(locale);
  return plans.find((plan) => plan.slug === slug) ?? null;
}

export async function getActivePlanSlugs(): Promise<string[]> {
  const plans = await loadActivePlans();
  return plans.map((plan) => plan.slug);
}
