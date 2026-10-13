import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { ScopeNote, ServiceCard } from "@/components/public/cards";
import { CtaBand } from "@/components/public/cta-band";
import { PageHero, Section } from "@/components/public/section";
import { pageMetadata } from "@/lib/metadata";
import { getServices, getSettings } from "@/server/queries/content";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Services");
  return pageMetadata({
    locale,
    path: "/services",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function ServicesPage() {
  const locale = await getLocale();
  const t = await getTranslations("Services");
  const [settings, services] = await Promise.all([
    getSettings(locale),
    getServices(locale),
  ]);

  return (
    <>
      <PageHero title={t("title")} lead={t("lead")} />

      <Section tone="cream" className="md:py-16">
        {services.length > 0 ? (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <li key={service.id}>
                <ServiceCard service={service} headingLevel="h2" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xl text-ink-muted">{t("empty")}</p>
        )}

        <ScopeNote text={settings.disclaimer} className="mt-12" />
      </Section>

      <CtaBand title={t("ctaTitle")} body={t("ctaBody")} phone={settings.phone} />
    </>
  );
}
