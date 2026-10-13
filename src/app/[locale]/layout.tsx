import type { Metadata, Viewport } from "next";
import { cacheLife } from "next/cache";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { bodyFont, headingFont } from "@/app/fonts";
import { ActionBar } from "@/components/public/action-bar";
import { Analytics } from "@/components/public/analytics";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/constants";
import { getSettings } from "@/server/queries/content";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Meta");
  const locale = await getLocale();

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t("defaultTitle"), template: t("titleTemplate") },
    description: t("defaultDescription"),
    applicationName: "Mabel Home Help",
    openGraph: {
      siteName: "Mabel Home Help",
      locale: locale === "fr" ? "fr_CA" : "en_CA",
      type: "website",
    },
    twitter: { card: "summary_large_image" },
    formatDetection: { telephone: true, email: true, address: true },
  };
}

export const viewport: Viewport = {
  themeColor: "#1f3d2b",
  width: "device-width",
  initialScale: 1,
};

// Only these namespaces are used by Client Components (menus and forms). The
// rest, including the long legal and email texts, stays on the server instead
// of being shipped to every visitor. Add a namespace here before calling
// useTranslations() with it in a "use client" file.
const CLIENT_NAMESPACES = [
  "Nav",
  "Actions",
  "Common",
  "Forms",
  "Book",
  "Contact",
  "Sponsor",
  "Membership",
  "Error",
] as const;

// The copyright year is the only time-dependent value on the public site.
async function getCurrentYear(): Promise<number> {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export default async function LocaleLayout({
  children,
}: LayoutProps<"/[locale]">) {
  // Validated against the supported locales in i18n/request.ts.
  const locale = await getLocale();
  const [settings, year, t, messages] = await Promise.all([
    getSettings(locale),
    getCurrentYear(),
    getTranslations("Nav"),
    getMessages(),
  ]);
  const clientMessages = Object.fromEntries(
    CLIENT_NAMESPACES.map((namespace) => [namespace, messages[namespace]]),
  );

  return (
    <html
      lang={locale === "fr" ? "fr-CA" : "en-CA"}
      data-scroll-behavior="smooth"
      className={`${headingFont.variable} ${bodyFont.variable}`}
    >
      <body className="flex min-h-dvh flex-col text-[1.125rem] leading-relaxed">
        <NextIntlClientProvider messages={clientMessages}>
          <a
            href="#main"
            className="sr-only z-50 rounded-xl bg-forest-900 px-5 py-3 font-bold text-cream-50 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
          >
            {t("skipToContent")}
          </a>
          <SiteHeader settings={settings} />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter settings={settings} year={year} />
          <ActionBar phone={settings.phone} />
        </NextIntlClientProvider>
        {/* Cookieless page-view analytics; only active when hosted on Vercel. */}
        {process.env.VERCEL ? <Analytics /> : null}
      </body>
    </html>
  );
}
