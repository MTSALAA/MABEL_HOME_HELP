import { ArrowRightIcon, CheckIcon, MapPinIcon } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/public/button-link";
import { Illustration, PlanCard, ServiceCard } from "@/components/public/cards";
import { ContactActions, CtaBand } from "@/components/public/cta-band";
import { Section, SectionHeading } from "@/components/public/section";
import { Link } from "@/i18n/navigation";
import { SITE_URL } from "@/lib/constants";
import { localizedUrl, pageMetadata } from "@/lib/metadata";
import { normalizePhone } from "@/lib/phone";
import { getPlans, getServices, getSettings } from "@/server/queries/content";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Meta");
  return {
    ...pageMetadata({
      locale,
      path: "/",
      title: t("defaultTitle"),
      description: t("defaultDescription"),
    }),
    title: { absolute: t("defaultTitle") },
  };
}

const STEPS = [
  { key: "one", illustration: "step-contact" },
  { key: "two", illustration: "step-plan" },
  { key: "three", illustration: "step-visit" },
] as const;

export default async function HomePage() {
  const locale = await getLocale();
  const t = await getTranslations("Home");
  const [settings, services, plans] = await Promise.all([
    getSettings(locale),
    getServices(locale),
    getPlans(locale),
  ]);

  const featured = services.filter((service) => service.isFeatured).slice(0, 6);
  const shownServices = featured.length > 0 ? featured : services.slice(0, 6);
  // "Small jobs. Friendly visits. Peace of mind." reads best one line each.
  const taglineLines = settings.tagline.split(/(?<=[.!?])\s+/).filter(Boolean);
  const national = settings.phone ? normalizePhone(settings.phone) : null;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/#business`,
    name: settings.businessName,
    description: t("hero.lead"),
    url: localizedUrl("/", locale),
    image: `${SITE_URL}/brand/logo.svg`,
    ...(national ? { telephone: `+1${national}` } : {}),
    ...(settings.email ? { email: settings.email } : {}),
    address: {
      "@type": "PostalAddress",
      addressLocality: "Edmonton",
      addressRegion: "AB",
      addressCountry: "CA",
    },
    areaServed: settings.serviceAreaValues.map((name) => ({
      "@type": "Place",
      name,
    })),
    makesOffer: services.map((service) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: service.title,
        description: service.description,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Escaping "<" keeps the JSON from ever closing the script tag.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />

      {/* Hero */}
      <section className="overflow-hidden bg-cream-50">
        <div className="page-container grid items-center gap-10 py-12 md:py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:py-20">
          <div>
            <p className="inline-flex rounded-full bg-forest-100 px-4 py-2 text-base font-bold text-forest-900">
              {t("hero.eyebrow")}
            </p>
            <h1 className="mt-5 text-[2.6rem] leading-[1.05] font-bold tracking-tight text-forest-900 sm:text-6xl lg:text-[3.25rem] xl:text-[3.75rem]">
              {taglineLines.map((line, index) => (
                <span
                  key={line}
                  className={
                    index === taglineLines.length - 1 && taglineLines.length > 1
                      ? "block text-forest-600"
                      : "block"
                  }
                >
                  {line}
                </span>
              ))}
            </h1>
            <p className="mt-6 max-w-xl text-xl leading-relaxed text-ink-muted md:text-[1.375rem]">
              {t("hero.lead")}
            </p>
            <ContactActions phone={settings.phone} className="mt-8" />
            <ul className="mt-8 flex flex-col gap-2.5">
              {(["point1", "point2", "point3"] as const).map((key) => (
                <li key={key} className="flex items-center gap-3 font-bold text-forest-900">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-forest-700 text-white">
                    <CheckIcon className="size-4" aria-hidden="true" />
                  </span>
                  {t(`hero.${key}`)}
                </li>
              ))}
            </ul>
          </div>
          <Illustration
            name="hero"
            alt={t("hero.illustrationAlt")}
            width={640}
            height={520}
            priority
            className="mx-auto h-auto w-full max-w-xl lg:max-w-none"
          />
        </div>
      </section>

      {/* Services */}
      <Section tone="white" aria-labelledby="home-services">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            id="home-services"
            title={t("services.title")}
            lead={t("services.lead")}
          />
          <ButtonLink href="/services" variant="secondary" size="md" className="shrink-0 self-start whitespace-nowrap md:self-auto">
            {t("services.all")}
            <ArrowRightIcon aria-hidden="true" />
          </ButtonLink>
        </div>
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shownServices.map((service) => (
            <li key={service.id}>
              <ServiceCard service={service} />
            </li>
          ))}
        </ul>
      </Section>

      {/* How it works */}
      <Section tone="sand" aria-labelledby="home-steps">
        <SectionHeading
          id="home-steps"
          align="center"
          title={t("steps.title")}
          lead={t("steps.lead")}
        />
        <ol className="mt-12 grid gap-8 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li
              key={step.key}
              className="relative flex flex-col items-center rounded-3xl bg-cream-50 px-6 pt-10 pb-8 text-center shadow-soft"
            >
              <span
                className="absolute -top-5 flex size-11 items-center justify-center rounded-full bg-forest-700 font-display text-xl font-bold text-white"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <Illustration
                name={step.illustration}
                width={128}
                height={128}
                className="size-32"
              />
              <h3 className="mt-4 text-2xl font-bold text-forest-900">
                {t(`steps.${step.key}.title`)}
              </h3>
              <p className="mt-2 text-ink-muted">{t(`steps.${step.key}.body`)}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* Plans */}
      {plans.length > 0 ? (
        <Section tone="cream" aria-labelledby="home-plans">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <SectionHeading
              id="home-plans"
              title={t("plans.title")}
              lead={t("plans.lead")}
            />
            <ButtonLink href="/pricing" variant="secondary" size="md" className="shrink-0 self-start whitespace-nowrap md:self-auto">
              {t("plans.all")}
              <ArrowRightIcon aria-hidden="true" />
            </ButtonLink>
          </div>
          <ul className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => (
              <li key={plan.id}>
                <PlanCard plan={plan} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* Mission and service area */}
      <Section tone="tint">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <figure>
            <p className="text-base font-bold tracking-[0.12em] text-forest-700 uppercase">
              {t("mission.label")}
            </p>
            <blockquote className="mt-4 border-l-4 border-honey pl-6 font-display text-[1.75rem] leading-snug font-medium text-forest-900 md:text-[2.125rem]">
              {t("mission.quote")}
            </blockquote>
          </figure>
          <div>
            <h2 className="text-[2rem] leading-tight font-bold text-forest-900">
              {t("areas.title")}
            </h2>
            <p className="mt-3 text-xl text-ink-muted">{t("areas.lead")}</p>
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
        </div>
      </Section>

      {/* Sponsor a Senior */}
      <Section tone="white" aria-labelledby="home-sponsor">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
          <Illustration
            name="sponsor"
            width={480}
            height={400}
            className="mx-auto h-auto w-full max-w-md"
          />
          <div>
            <h2
              id="home-sponsor"
              className="text-[2rem] leading-tight font-bold text-forest-900 md:text-[2.5rem]"
            >
              {t("sponsor.title")}
            </h2>
            <p className="mt-4 text-xl leading-relaxed text-ink-muted">
              {t("sponsor.body")}
            </p>
            <Link
              href="/sponsor-a-senior"
              className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-lg text-xl font-bold text-forest-700 underline-offset-4 hover:underline"
            >
              {t("sponsor.cta")}
              <ArrowRightIcon className="size-5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </Section>

      <CtaBand title={t("cta.title")} body={t("cta.body")} phone={settings.phone} />
    </>
  );
}
