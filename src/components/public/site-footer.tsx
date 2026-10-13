import { ClockIcon, MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { LocalizedSettings } from "@/lib/localize";
import { formatPhone, telHref } from "@/lib/phone";
import { EmailText } from "./email-text";
import { Logo } from "./logo";
import { NAV_ITEMS } from "./nav-items";

const linkClass =
  "inline-flex min-h-11 items-center rounded-lg text-cream-50 underline-offset-4 hover:underline";

export async function SiteFooter({
  settings,
  year,
}: {
  settings: LocalizedSettings;
  year: number;
}) {
  const t = await getTranslations("Footer");
  const tNav = await getTranslations("Nav");
  const tActions = await getTranslations("Actions");

  return (
    // Extra bottom padding on small screens keeps the sticky action bar from
    // covering the last lines.
    <footer className="bg-forest-900 pb-28 text-cream-50 lg:pb-0">
      <div className="page-container grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo tone="light" />
          <p className="mt-5 max-w-sm font-display text-xl leading-snug text-cream-50">
            {settings.tagline}
          </p>
        </div>

        <div>
          <h2 className="font-sans text-base font-bold tracking-wide text-forest-300 uppercase">
            {t("contactTitle")}
          </h2>
          <ul className="mt-3 flex flex-col">
            <li>
              {settings.phone ? (
                <a
                  href={telHref(settings.phone)}
                  className={`${linkClass} gap-2.5 text-lg font-bold`}
                >
                  <PhoneIcon className="size-5 text-honey" aria-hidden="true" />
                  {formatPhone(settings.phone)}
                </a>
              ) : (
                <span className="inline-flex min-h-11 items-center gap-2.5 text-forest-300">
                  <PhoneIcon className="size-5" aria-hidden="true" />
                  {tActions("phoneComingSoon")}
                </span>
              )}
            </li>
            {settings.email ? (
              <li>
                <a
                  href={`mailto:${settings.email}`}
                  className={`${linkClass} gap-2.5`}
                >
                  <MailIcon className="size-5 shrink-0 text-honey" aria-hidden="true" />
                  <EmailText email={settings.email} />
                </a>
              </li>
            ) : null}
            <li className="inline-flex min-h-11 items-center gap-2.5">
              <MapPinIcon className="size-5 shrink-0 text-honey" aria-hidden="true" />
              {settings.location}
            </li>
            {settings.hours ? (
              <li className="inline-flex min-h-11 items-center gap-2.5">
                <ClockIcon className="size-5 shrink-0 text-honey" aria-hidden="true" />
                {settings.hours}
              </li>
            ) : null}
          </ul>
        </div>

        <div>
          <h2 className="font-sans text-base font-bold tracking-wide text-forest-300 uppercase">
            {t("areasTitle")}
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {settings.serviceAreas.map((area) => (
              <li key={area}>{area}</li>
            ))}
          </ul>
        </div>

        <nav aria-label={t("exploreTitle")}>
          <h2 className="font-sans text-base font-bold tracking-wide text-forest-300 uppercase">
            {t("exploreTitle")}
          </h2>
          <ul className="mt-3 flex flex-col">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkClass}>
                  {tNav(item.key)}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/book" className={linkClass}>
                {tNav("book")}
              </Link>
            </li>
            <li>
              <Link href="/membership/manage" className={linkClass}>
                {t("manageMembership")}
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-cream-50/15">
        <div className="page-container py-8">
          <p className="max-w-3xl text-base leading-relaxed text-cream-50">
            <strong className="text-honey">{t("scopeTitle")}: </strong>
            {settings.disclaimer}
          </p>
          <div className="mt-6 flex flex-col gap-2 text-[0.95rem] text-forest-300 sm:flex-row sm:items-center sm:justify-between">
            <p>{t("rights", { year, name: settings.businessName })}</p>
            <ul className="flex flex-wrap gap-x-6">
              <li>
                <Link href="/privacy" className={`${linkClass} text-forest-300`}>
                  {t("privacy")}
                </Link>
              </li>
              <li>
                <Link href="/terms" className={`${linkClass} text-forest-300`}>
                  {t("terms")}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
