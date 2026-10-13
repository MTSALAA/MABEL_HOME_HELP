import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { SponsorForm } from "@/components/forms/sponsor-form";
import { Illustration, ScopeNote } from "@/components/public/cards";
import { Section, SectionHeading } from "@/components/public/section";
import { pageMetadata } from "@/lib/metadata";
import { getSettings } from "@/server/queries/content";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Sponsor");
  return pageMetadata({
    locale,
    path: "/sponsor-a-senior",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

const HOW = ["sponsor", "nominate", "match"] as const;

export default async function SponsorPage() {
  const locale = await getLocale();
  const t = await getTranslations("Sponsor");
  const settings = await getSettings(locale);

  return (
    <>
      <section className="border-b border-cream-300 bg-cream-100">
        <div className="page-container grid items-center gap-10 py-12 md:py-16 lg:grid-cols-[1.1fr_1fr]">
          <SectionHeading as="h1" title={t("title")} lead={t("lead")} />
          <Illustration
            name="sponsor"
            alt={t("illustrationAlt")}
            width={480}
            height={400}
            priority
            className="mx-auto h-auto w-full max-w-md"
          />
        </div>
      </section>

      <Section tone="cream" aria-labelledby="sponsor-how">
        <SectionHeading id="sponsor-how" title={t("howTitle")} />
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {HOW.map((key, index) => (
            <li
              key={key}
              className="rounded-3xl border border-cream-300 bg-white p-7 shadow-soft"
            >
              <span
                className="flex size-11 items-center justify-center rounded-full bg-forest-700 font-display text-xl font-bold text-white"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <h3 className="mt-4 text-2xl font-bold text-forest-900">
                {t(`how.${key}.title`)}
              </h3>
              <p className="mt-2 text-ink-muted">{t(`how.${key}.body`)}</p>
            </li>
          ))}
        </ol>
        <p className="mt-8 max-w-3xl text-ink-muted">{t("note")}</p>
      </Section>

      <Section tone="tint" aria-labelledby="sponsor-form">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-14">
          <div>
            <h2
              id="sponsor-form"
              className="text-[2rem] leading-tight font-bold text-forest-900 md:text-[2.5rem]"
            >
              {t("formTitle")}
            </h2>
            <p className="mt-4 text-xl leading-relaxed text-ink-muted">
              {t("formLead")}
            </p>
            <ScopeNote text={settings.disclaimer} className="mt-8" />
          </div>
          <div className="rounded-3xl border border-cream-300 bg-white p-6 shadow-soft md:p-9">
            <SponsorForm />
          </div>
        </div>
      </Section>
    </>
  );
}
