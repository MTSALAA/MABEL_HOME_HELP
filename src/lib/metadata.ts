import type { Metadata } from "next";
import type { AppLocale } from "@/i18n/routing";
import { SITE_URL } from "@/lib/constants";

/** Absolute URL of a public path ("/services") in the given language. */
export function localizedUrl(path: string, locale: AppLocale): string {
  const clean = path === "/" ? "" : path;
  return `${SITE_URL}${locale === "fr" ? "/fr" : ""}${clean}` || SITE_URL;
}

/**
 * Per-page metadata: title, description, canonical URL and the hreflang
 * alternates that tell search engines the two language versions belong
 * together.
 */
export function pageMetadata(options: {
  locale: AppLocale;
  path: string;
  title: string;
  description?: string;
  noIndex?: boolean;
}): Metadata {
  const { locale, path, title, description, noIndex } = options;
  const url = localizedUrl(path, locale);
  // Setting openGraph on a page replaces the layout's, so the share image
  // (app/[locale]/opengraph-image.tsx) has to be named again here.
  const shareImage = {
    url: `${locale === "fr" ? "/fr" : ""}/opengraph-image`,
    width: 1200,
    height: 630,
    alt: "Mabel Home Help",
  };

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        "en-CA": localizedUrl(path, "en"),
        "fr-CA": localizedUrl(path, "fr"),
        "x-default": localizedUrl(path, "en"),
      },
    },
    openGraph: {
      title,
      description,
      url,
      locale: locale === "fr" ? "fr_CA" : "en_CA",
      type: "website",
      siteName: "Mabel Home Help",
      images: [shareImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [shareImage],
    },
    robots: noIndex ? { index: false, follow: false } : undefined,
  };
}
