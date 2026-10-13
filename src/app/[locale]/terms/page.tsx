import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { LegalPage } from "@/components/public/legal-page";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Legal.terms");
  return pageMetadata({ locale, path: "/terms", title: t("metaTitle") });
}

const SECTIONS = [
  "scope",
  "requests",
  "membership",
  "billing",
  "cancel",
  "changes",
  "conduct",
  "liability",
  "law",
  "contact",
] as const;

export default function TermsPage() {
  return <LegalPage doc="terms" sections={SECTIONS} />;
}
