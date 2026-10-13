import { getLocale, getTranslations } from "next-intl/server";
import { PageHero, Section } from "@/components/public/section";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/locale";

// Bump when the wording of the privacy policy or terms changes.
const LEGAL_UPDATED = new Date("2026-10-12T12:00:00-06:00");

/** Renders a legal document from the Legal.<doc> message namespace. */
export async function LegalPage({
  doc,
  sections,
}: {
  doc: "privacy" | "terms";
  sections: readonly string[];
}) {
  const locale = await getLocale();
  const t = await getTranslations("Legal");
  const tNav = await getTranslations("Nav");

  return (
    <>
      <PageHero title={t(`${doc}.title`)}>
        <p className="mt-4 text-ink-muted">
          {t("updated", { date: formatDate(LEGAL_UPDATED, locale) })}
        </p>
      </PageHero>
      <Section tone="cream" className="md:py-16">
        <div className="prose-mabel">
          <p className="text-xl leading-relaxed">{t(`${doc}.intro`)}</p>
          {sections.map((key) => (
            <section key={key} className="mt-10">
              <h2 className="text-[1.75rem] leading-tight font-bold text-forest-900">
                {t(`${doc}.sections.${key}.title`)}
              </h2>
              <div className="mt-3">
                {t(`${doc}.sections.${key}.body`)
                  .split("\n\n")
                  .map((paragraph) => (
                    <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                  ))}
              </div>
            </section>
          ))}
          <p className="mt-10">
            <Link
              href="/contact"
              className="inline-flex min-h-11 items-center font-bold text-forest-700 underline underline-offset-4"
            >
              {tNav("contact")}
            </Link>
          </p>
        </div>
      </Section>
    </>
  );
}
