import type { AppLocale } from "@/i18n/routing";

/** 20000 -> "$200.00" (en) or "200,00 $" (fr). */
export function formatCad(cents: number, locale: AppLocale): string {
  return new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    style: "currency",
    currency: "CAD",
    currencyDisplay: "narrowSymbol",
  }).format(cents / 100);
}

/** "200" or "200.50" -> 20000 / 20050. Returns null for anything else. */
export function parseDollarsToCents(input: string): number | null {
  const cleaned = input.trim().replace(/[$\s]/g, "").replace(",", ".");
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(cleaned)) return null;
  return Math.round(Number(cleaned) * 100);
}
