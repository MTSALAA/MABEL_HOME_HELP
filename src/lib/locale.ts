import type { Locale } from "@prisma/client";
import type { AppLocale } from "@/i18n/routing";

export function toDbLocale(locale: AppLocale): Locale {
  return locale === "fr" ? "FR" : "EN";
}

export function fromDbLocale(locale: Locale): AppLocale {
  return locale === "FR" ? "fr" : "en";
}

/** "" for English, "/fr" for French: prefix for absolute URLs in emails. */
export function localePrefix(locale: AppLocale): string {
  return locale === "fr" ? "/fr" : "";
}

export function formatDate(date: Date, locale: AppLocale): string {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    dateStyle: "long",
    timeZone: "America/Edmonton",
  }).format(date);
}
