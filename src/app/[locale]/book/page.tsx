import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { BookingForm } from "@/components/forms/booking-form";
import { ScopeNote } from "@/components/public/cards";
import { PageHero, Section } from "@/components/public/section";
import { pageMetadata } from "@/lib/metadata";
import { formatPhone, telHref } from "@/lib/phone";
import { getPlans, getServices, getSettings } from "@/server/queries/content";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Book");
  return pageMetadata({
    locale,
    path: "/book",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function BookPage() {
  const locale = await getLocale();
  const t = await getTranslations("Book");
  const tCommon = await getTranslations("Common");
  const [settings, services, plans] = await Promise.all([
    getSettings(locale),
    getServices(locale),
    getPlans(locale),
  ]);

  return (
    <>
      <PageHero title={t("title")} lead={t("lead")} />

      <Section tone="cream" className="md:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-14">
          <div className="rounded-3xl border border-cream-300 bg-white p-6 shadow-soft md:p-9">
            <BookingForm
              services={services.map(({ id, slug, title }) => ({ id, slug, title }))}
              plans={plans.map(({ id, slug, name }) => ({ id, slug, name }))}
              areas={settings.serviceAreaValues.map((value, index) => ({
                value,
                label: settings.serviceAreas[index] ?? value,
              }))}
            />
          </div>

          <aside className="flex flex-col gap-6 lg:pt-2">
            <div className="rounded-3xl bg-forest-900 p-7 text-cream-50">
              <h2 className="text-2xl font-bold">{t("asideTitle")}</h2>
              <ol className="mt-5 flex flex-col gap-4">
                {(["aside1", "aside2", "aside3"] as const).map((key, index) => (
                  <li key={key} className="flex gap-4">
                    <span
                      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-honey font-display text-lg font-bold text-forest-950"
                      aria-hidden="true"
                    >
                      {index + 1}
                    </span>
                    <span className="pt-0.5">{t(key)}</span>
                  </li>
                ))}
              </ol>
              {settings.phone ? (
                <p className="mt-6 border-t border-cream-50/20 pt-5">
                  {tCommon.rich("orCall", {
                    phone: formatPhone(settings.phone),
                    tel: (chunks) => (
                      <a
                        href={telHref(settings.phone as string)}
                        className="font-bold whitespace-nowrap text-honey underline underline-offset-4"
                      >
                        {chunks}
                      </a>
                    ),
                  })}
                </p>
              ) : null}
            </div>
            <ScopeNote text={settings.disclaimer} />
          </aside>
        </div>
      </Section>
    </>
  );
}
