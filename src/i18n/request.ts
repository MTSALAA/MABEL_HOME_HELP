import * as rootParams from "next/root-params";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "./routing";

export default getRequestConfig(async ({ locale }) => {
  // An explicit locale (e.g. getTranslations({locale})) wins; otherwise read
  // the [locale] root segment. Root params are unavailable in Server Actions
  // and Route Handlers, so those always pass the locale explicitly.
  if (!locale) {
    const segment = await rootParams.locale();
    if (!hasLocale(routing.locales, segment)) {
      notFound();
    }
    locale = segment;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    timeZone: "America/Edmonton",
  };
});
