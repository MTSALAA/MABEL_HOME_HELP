"use client";

import { MenuIcon, PhoneIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { formatPhone, telHref } from "@/lib/phone";
import { cn } from "@/lib/utils";
import { ButtonLink } from "./button-link";
import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "./logo";
import { NAV_ITEMS } from "./nav-items";

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopNav() {
  const t = useTranslations("Nav");
  const pathname = usePathname();

  return (
    <nav aria-label={t("mainNavigation")} className="hidden lg:block">
      <ul className="flex items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-xl px-2.5 text-base font-bold whitespace-nowrap transition-colors xl:px-3.5 xl:text-[1.0625rem]",
                  active
                    ? "bg-forest-100 text-forest-900"
                    : "text-ink hover:bg-cream-100",
                )}
              >
                {t(item.key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * The phone and tablet menu. It is a native <dialog>: the browser provides
 * the focus trap, Escape to close and returning focus to the button, with no
 * extra library on public pages.
 */
export function MobileNav({ phone }: { phone: string | null }) {
  const t = useTranslations("Nav");
  const tActions = useTranslations("Actions");
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const close = () => dialogRef.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-label={t("openMenu")}
        aria-haspopup="dialog"
        className="inline-flex size-12 items-center justify-center rounded-xl border-2 border-forest-700 bg-white text-forest-900 lg:hidden"
      >
        <MenuIcon className="size-6" aria-hidden="true" />
      </button>

      <dialog
        ref={dialogRef}
        aria-label={t("mainNavigation")}
        // A click on the dimmed area outside the panel lands on the dialog
        // element itself.
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-[min(22rem,100vw)] max-w-full flex-col overflow-y-auto bg-cream-50 p-0 text-ink shadow-lift backdrop:bg-forest-950/50 open:flex"
      >
        <div className="flex items-center justify-between border-b border-cream-300 px-5 py-4">
          <Logo />
          <button
            type="button"
            onClick={close}
            aria-label={t("closeMenu")}
            className="inline-flex size-12 items-center justify-center rounded-xl border-2 border-forest-700 bg-white text-forest-900"
          >
            <XIcon className="size-6" aria-hidden="true" />
          </button>
        </div>

        <nav aria-label={t("mainNavigation")} className="px-3 py-4">
          <ul className="flex flex-col gap-1">
            {[{ href: "/", key: "home" } as const, ...NAV_ITEMS].map((item) => {
              const active =
                item.href === "/" ? pathname === "/" : isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={close}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-14 items-center rounded-xl px-4 text-xl font-bold",
                      active
                        ? "bg-forest-100 text-forest-900"
                        : "text-ink hover:bg-cream-100",
                    )}
                  >
                    {t(item.key)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-auto flex flex-col gap-3 border-t border-cream-300 px-5 py-5">
          <ButtonLink href="/book" onClick={close}>
            {t("book")}
          </ButtonLink>
          {phone ? (
            <a
              href={telHref(phone)}
              className="inline-flex min-h-14 items-center justify-center gap-2.5 rounded-2xl border-2 border-forest-700 bg-white px-5 text-lg font-bold text-forest-900"
            >
              <PhoneIcon className="size-5" aria-hidden="true" />
              {tActions("callNumber", { phone: formatPhone(phone) })}
            </a>
          ) : null}
          <div onClick={close}>
            <LanguageSwitcher className="w-full justify-center border-2 border-cream-300 bg-white" />
          </div>
        </div>
      </dialog>
    </>
  );
}
