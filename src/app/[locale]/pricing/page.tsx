import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { PlanCard, ScopeNote } from "@/components/public/cards";
import { CtaBand } from "@/components/public/cta-band";
import { PageHero, Section } from "@/components/public/section";
import { Link } from "@/i18n/navigation";
import { pageMetadata } from "@/lib/metadata";
import { getPlans, getSettings } from "@/server/queries/content";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Pricing");
  return pageMetadata({
    locale,
    path: "/pricing",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

const FAQ_KEYS = ["visit", "cancel", "unused", "area", "pay", "medical"] as const;

export default async function PricingPage() {
  const locale = await getLocale();
  const t = await getTranslations("Pricing");
  const tHome = await getTranslations("Home");
  const [settings, plans] = await Promise.all([
    getSettings(locale),
    getPlans(locale),
  ]);
  const anyOnline = plans.some((plan) => plan.canBuyOnline);

  return (
    <>
      <PageHero title={t("title")} lead={t("lead")} />

      <Section tone="cream" className="md:py-16">
        {plans.length > 0 ? (
          <ul className="grid gap-x-6 gap-y-10 pt-4 sm:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => (
              <li key={plan.id}>
                <PlanCard plan={plan} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xl text-ink-muted">{t("empty")}</p>
        )}

        <div className="mt-8 flex flex-col gap-2 text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p>{t("currencyNote")}</p>
          {anyOnline ? (
            <Link
              href="/membership/manage"
              className="inline-flex min-h-11 items-center rounded-lg font-bold text-forest-700 underline underline-offset-4"
            >
              {t("manage")}
            </Link>
          ) : null}
        </div>
      </Section>

      <Section tone="white" aria-labelledby="pricing-faq">
        <h2
          id="pricing-faq"
          className="text-[2rem] leading-tight font-bold text-forest-900 md:text-[2.5rem]"
        >
          {t("faqTitle")}
        </h2>
        <div className="mt-8 grid gap-x-12 gap-y-8 md:grid-cols-2">
          {FAQ_KEYS.map((key) => (
            <div key={key} className="border-t-2 border-cream-300 pt-5">
              <h3 className="text-xl font-bold text-forest-900">
                {t(`faq.${key}.q`)}
              </h3>
              <p className="mt-2 text-ink-muted">{t(`faq.${key}.a`)}</p>
            </div>
          ))}
        </div>
        <ScopeNote text={settings.disclaimer} className="mt-12" />
      </Section>

      <CtaBand
        title={tHome("cta.title")}
        body={tHome("cta.body")}
        phone={settings.phone}
      />
    </>
  );
}
