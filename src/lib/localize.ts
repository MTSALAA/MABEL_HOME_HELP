import type { Plan, Service, SiteSettings } from "@prisma/client";
import type { AppLocale } from "@/i18n/routing";

/** French value when present, otherwise the English one. */
export function pick(
  locale: AppLocale,
  en: string,
  fr: string | null | undefined,
): string {
  if (locale === "fr" && fr && fr.trim() !== "") return fr;
  return en;
}

function pickOptional(
  locale: AppLocale,
  en: string | null | undefined,
  fr: string | null | undefined,
): string | null {
  if (locale === "fr" && fr && fr.trim() !== "") return fr;
  return en && en.trim() !== "" ? en : null;
}

function pickList(locale: AppLocale, en: string[], fr: string[]): string[] {
  return locale === "fr" && fr.length > 0 ? fr : en;
}

export type LocalizedService = {
  id: string;
  slug: string;
  title: string;
  description: string;
  illustration: string;
  imageUrl: string | null;
  isFeatured: boolean;
};

export function localizeService(
  service: Service,
  locale: AppLocale,
): LocalizedService {
  return {
    id: service.id,
    slug: service.slug,
    title: pick(locale, service.titleEn, service.titleFr),
    description: pick(locale, service.descriptionEn, service.descriptionFr),
    illustration: service.illustration,
    imageUrl: service.imageUrl,
    isFeatured: service.isFeatured,
  };
}

export type LocalizedPlan = {
  id: string;
  slug: string;
  name: string;
  priceText: string;
  includes: string;
  note: string | null;
  isHighlighted: boolean;
  /** True only when the plan can really be bought right now. */
  canBuyOnline: boolean;
  monthlyCents: number | null;
};

export function localizePlan(
  plan: Plan,
  locale: AppLocale,
  stripeEnabled: boolean,
): LocalizedPlan {
  return {
    id: plan.id,
    slug: plan.slug,
    name: pick(locale, plan.nameEn, plan.nameFr),
    priceText: pick(locale, plan.priceTextEn, plan.priceTextFr),
    includes: pick(locale, plan.includesEn, plan.includesFr),
    note: pickOptional(locale, plan.noteEn, plan.noteFr),
    isHighlighted: plan.isHighlighted,
    canBuyOnline:
      stripeEnabled &&
      plan.isPurchasable &&
      plan.monthlyCents !== null &&
      plan.stripePriceId !== null,
    monthlyCents: plan.monthlyCents,
  };
}

export type LocalizedSettings = {
  businessName: string;
  tagline: string;
  phone: string | null;
  email: string | null;
  location: string;
  serviceAreas: string[];
  /** English names, the stable values stored on requests and memberships. */
  serviceAreaValues: string[];
  hours: string | null;
  disclaimer: string;
};

export function localizeSettings(
  settings: SiteSettings,
  locale: AppLocale,
): LocalizedSettings {
  const areas = pickList(locale, settings.serviceAreasEn, settings.serviceAreasFr);
  return {
    businessName: settings.businessName,
    tagline: pick(locale, settings.taglineEn, settings.taglineFr),
    phone: settings.phone && settings.phone.trim() !== "" ? settings.phone : null,
    email: settings.email && settings.email.trim() !== "" ? settings.email : null,
    location: settings.location,
    // Fall back to English labels if the French list is a different length,
    // so labels and stored values can never drift out of step.
    serviceAreas:
      areas.length === settings.serviceAreasEn.length
        ? areas
        : settings.serviceAreasEn,
    serviceAreaValues: settings.serviceAreasEn,
    hours: pickOptional(locale, settings.hoursEn, settings.hoursFr),
    disclaimer: pick(locale, settings.disclaimerEn, settings.disclaimerFr),
  };
}
