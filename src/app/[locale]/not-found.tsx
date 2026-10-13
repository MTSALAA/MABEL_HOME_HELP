import { getLocale, getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/public/button-link";
import { Illustration } from "@/components/public/cards";
import { ContactActions } from "@/components/public/cta-band";
import { getSettings } from "@/server/queries/content";

export default async function NotFound() {
  const locale = await getLocale();
  const t = await getTranslations("NotFound");
  const tCommon = await getTranslations("Common");
  const settings = await getSettings(locale);

  return (
    <section className="bg-cream-50 py-16 md:py-24">
      <div className="page-container flex flex-col items-center text-center">
        <Illustration
          name="not-found"
          alt={t("illustrationAlt")}
          width={240}
          height={200}
          className="h-48 w-auto"
        />
        <h1 className="mt-6 text-[2.5rem] leading-tight font-bold text-forest-900 md:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-4 max-w-xl text-xl text-ink-muted">{t("body")}</p>
        <div className="mt-8 flex flex-col items-center gap-4">
          <ButtonLink href="/">{tCommon("backHome")}</ButtonLink>
          <ContactActions phone={settings.phone} className="justify-center" />
        </div>
      </div>
    </section>
  );
}
