import { MapPinIcon, PhoneIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Link } from "@/i18n/navigation";
import type { LocalizedSettings } from "@/lib/localize";
import { formatPhone, telHref } from "@/lib/phone";
import { ButtonLink } from "./button-link";
import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "./logo";
import { DesktopNav, MobileNav } from "./nav";

export async function SiteHeader({ settings }: { settings: LocalizedSettings }) {
  const t = await getTranslations("Nav");
  const tActions = await getTranslations("Actions");
  const areas = settings.serviceAreas.slice(0, 3).join(" · ");

  return (
    <>
      {/* Utility bar: the phone number and language are always one tap away. */}
      <div className="bg-forest-900 text-cream-50">
        <div className="page-container flex min-h-11 items-center justify-between gap-3 text-[0.95rem]">
          {areas ? (
            <p className="hidden min-w-0 items-center gap-2 md:flex">
              <MapPinIcon className="size-4 shrink-0 text-honey" aria-hidden="true" />
              <span className="truncate">{areas}</span>
            </p>
          ) : (
            <span className="hidden md:block" />
          )}
          <div className="flex flex-1 items-center justify-between gap-2 md:flex-none md:justify-end md:gap-4">
            {settings.phone ? (
              <a
                href={telHref(settings.phone)}
                aria-label={tActions("callNumber", {
                  phone: formatPhone(settings.phone),
                })}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg text-[1.0625rem] font-bold whitespace-nowrap hover:underline"
              >
                <PhoneIcon className="size-4 text-honey" aria-hidden="true" />
                {formatPhone(settings.phone)}
              </a>
            ) : (
              <span />
            )}
            <Suspense fallback={null}>
              <LanguageSwitcher className="min-h-11 px-2 text-[0.95rem] text-cream-50 hover:bg-cream-50/10" />
            </Suspense>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-cream-300 bg-cream-50/95 backdrop-blur supports-[backdrop-filter]:bg-cream-50/85">
        <div className="page-container flex h-[4.5rem] items-center justify-between gap-3">
          <Link
            href="/"
            aria-label={`${settings.businessName}: ${t("home")}`}
            className="shrink-0 rounded-xl"
          >
            <Logo />
          </Link>

          {/* Navigation reads the current path, so it streams in on its own. */}
          <Suspense fallback={null}>
            <DesktopNav />
          </Suspense>

          <div className="flex shrink-0 items-center gap-2">
            <ButtonLink
              href="/book"
              size="md"
              className="hidden whitespace-nowrap sm:inline-flex"
            >
              {t("book")}
            </ButtonLink>
            <Suspense fallback={<span className="size-12 lg:hidden" />}>
              <MobileNav phone={settings.phone} />
            </Suspense>
          </div>
        </div>
      </header>
    </>
  );
}
