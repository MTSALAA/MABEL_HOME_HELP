import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import type { ReactNode } from "react";
import { getAdminLocale } from "@/server/admin-i18n";
import { DocumentLanguage } from "./language-switch";

/**
 * Gives everything inside it the admin's language (see getAdminLocale). It
 * reads a cookie, so it must sit inside a <Suspense> boundary.
 */
export async function AdminIntl({ children }: { children: ReactNode }) {
  const locale = await getAdminLocale();
  const messages = await getMessages({ locale });
  const lang = locale === "fr" ? "fr-CA" : "en-CA";

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={{ Admin: messages.Admin }}
      timeZone="America/Edmonton"
    >
      {/* <html lang> belongs to the static shell, so the language is declared
          here, and on <html> itself once the page is interactive (dialogs and
          toasts are rendered outside this element). */}
      <div lang={lang} className="contents">
        {children}
      </div>
      <DocumentLanguage lang={lang} />
    </NextIntlClientProvider>
  );
}
