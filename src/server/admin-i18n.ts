import { cookies, headers } from "next/headers";
import { hasLocale } from "next-intl";
import { getFormatter, getTranslations } from "next-intl/server";
import { routing, type AppLocale } from "@/i18n/routing";
import { ADMIN_LOCALE_COOKIE } from "@/lib/constants";

/**
 * Language of the admin dashboard. It is a personal preference kept in a
 * cookie (the admin has no /fr URLs); on a first visit it follows the
 * browser's language.
 */
export async function getAdminLocale(): Promise<AppLocale> {
  const saved = (await cookies()).get(ADMIN_LOCALE_COOKIE)?.value;
  if (hasLocale(routing.locales, saved)) return saved;

  const preferred = (await headers()).get("accept-language") ?? "";
  return preferred.trim().toLowerCase().startsWith("fr")
    ? "fr"
    : routing.defaultLocale;
}

/**
 * Translations for one admin area, e.g. getAdminT("Requests") reads
 * "Admin.Requests" from messages/*.json. Works in pages and Server Actions.
 */
export async function getAdminT(area: string) {
  return getTranslations({
    locale: await getAdminLocale(),
    namespace: `Admin.${area}`,
  });
}

/** Label for an enum value (NEW, PAST_DUE, CALL...) in the admin's language. */
export async function getAdminLabels() {
  const t = await getAdminT("Labels");
  return (value: string | null | undefined): string => {
    if (!value) return "";
    return t.has(value) ? t(value) : value;
  };
}

/** Dates in the admin's language, always in the business's time zone. */
export async function getAdminFormat() {
  const format = await getFormatter({ locale: await getAdminLocale() });
  return {
    dateTime: (date: Date) =>
      format.dateTime(date, { dateStyle: "medium", timeStyle: "short" }),
    day: (date: Date | null | undefined) =>
      date ? format.dateTime(date, { dateStyle: "medium" }) : "",
  };
}
