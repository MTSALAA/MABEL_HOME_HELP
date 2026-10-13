import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "fr"],
  defaultLocale: "en",
  // English has no prefix, French lives under /fr.
  localePrefix: "as-needed",
});

export type AppLocale = (typeof routing.locales)[number];
