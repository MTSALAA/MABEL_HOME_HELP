import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { LegalPage } from "@/components/public/legal-page";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Legal.privacy");
  return pageMetadata({ locale, path: "/privacy", title: t("metaTitle") });
}

const SECTIONS = [
  "collect",
  "use",
  "payments",
  "share",
  "family",
  "retain",
  "cookies",
  "rights",
  "contact",
] as const;

export default function PrivacyPage() {
  return <LegalPage doc="privacy" sections={SECTIONS} />;
}
