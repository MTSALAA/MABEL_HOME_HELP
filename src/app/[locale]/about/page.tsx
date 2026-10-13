import {
  BadgeDollarSignIcon,
  ClockIcon,
  HeartHandshakeIcon,
  MapPinIcon,
  SmileIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Illustration, ScopeNote } from "@/components/public/cards";
import { CtaBand } from "@/components/public/cta-band";
import { Section, SectionHeading } from "@/components/public/section";
import { pageMetadata } from "@/lib/metadata";
import { getSettings } from "@/server/queries/content";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("About");
  return pageMetadata({
    locale,
    path: "/about",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

const VALUES = [
  { key: "reliable", Icon: ClockIcon },
  { key: "friendly", Icon: SmileIcon },
  { key: "affordable", Icon: BadgeDollarSignIcon },
  { key: "respectful", Icon: HeartHandshakeIcon },
] as const;

export default async function AboutPage() {
  const locale = await getLocale();
  const t = await getTranslations("About");
  const tHome = await getTranslations("Home");
  const settings = await getSettings(locale);

  return (
    <>
      <section className="border-b border-cream-300 bg-cream-100">
        <div className="page-container grid items-center gap-10 py-12 md:py-16 lg:grid-cols-[1.1fr_1fr]">
          <SectionHeading as="h1" title={t("title")} lead={t("lead")} />
          <Illustration
            name="about"
            alt={t("illustrationAlt")}
            width={480}
            height={400}
            priority
            className="mx-auto h-auto w-full max-w-md"
          />
        </div>
      </section>

      <Section tone="cream">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
          <div className="prose-mabel text-xl leading-relaxed text-ink">
            <h2 className="mb-5 text-[2rem] leading-tight font-bold text-forest-900">
              {t("storyTitle")}
            </h2>
            <p>{t("story1")}</p>
            <p>{t("story2")}</p>
            <p>{t("story3")}</p>
          </div>
          <figure className="self-start rounded-3xl bg-forest-900 p-8 text-cream-50">
            <figcaption className="text-base font-bold tracking-[0.12em] text-honey uppercase">
              {t("missionTitle")}
            </figcaption>
            <blockquote className="mt-4 font-display text-[1.6rem] leading-snug font-medium">
              {tHome("mission.quote")}
            </blockquote>
          </figure>
        </div>
      </Section>

      <Section tone="white" aria-labelledby="about-values">
        <SectionHeading id="about-values" title={t("valuesTitle")} />
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map(({ key, Icon }) => (
            <li key={key} className="rounded-3xl border border-cream-300 bg-cream-50 p-6">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-forest-700 text-white">
                <Icon className="size-7" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-2xl font-bold text-forest-900">
                {t(`values.${key}.title`)}
              </h3>
              <p className="mt-2 text-ink-muted">{t(`values.${key}.body`)}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="tint" aria-labelledby="about-areas">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2
              id="about-areas"
              className="text-[2rem] leading-tight font-bold text-forest-900"
            >
              {t("areasTitle")}
            </h2>
            <ul className="mt-6 flex flex-wrap gap-3">
              {settings.serviceAreas.map((area) => (
                <li
                  key={area}
                  className="inline-flex items-center gap-2 rounded-full border border-forest-300 bg-white px-4 py-2.5 font-bold text-forest-900"
                >
                  <MapPinIcon className="size-5 text-forest-500" aria-hidden="true" />
                  {area}
                </li>
              ))}
            </ul>
          </div>
          <ScopeNote text={settings.disclaimer} className="self-start" />
        </div>
      </Section>

      <CtaBand title={t("ctaTitle")} body={t("ctaBody")} phone={settings.phone} />
    </>
  );
}
