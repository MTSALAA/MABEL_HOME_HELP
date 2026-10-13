"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { routing } from "@/i18n/routing";
import { ADMIN_LOCALE_COOKIE } from "@/lib/constants";
import { cn } from "@/lib/utils";

const NAMES = { en: "English", fr: "Français" } as const;

type AdminLocale = (typeof routing.locales)[number];

/** Kept for a year, for the admin only; read by getAdminLocale() on the server. */
function rememberLocale(locale: AdminLocale) {
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${ADMIN_LOCALE_COOKIE}=${locale}; path=/admin; max-age=31536000; samesite=lax${secure}`;
}

/** Keeps <html lang> in step with the admin's language. */
export function DocumentLanguage({ lang }: { lang: string }) {
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return null;
}

/**
 * English / Français switch for the dashboard. The choice is a preference of
 * this browser (a cookie), not part of the address, and applies at once.
 */
export function LanguageSwitch({
  tone = "light",
  className,
}: {
  /** "light" on pale backgrounds, "dark" on the green sidebar. */
  tone?: "light" | "dark";
  className?: string;
}) {
  const locale = useLocale();
  const t = useTranslations("Admin.Common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function choose(next: AdminLocale) {
    if (next === locale) return;
    rememberLocale(next);
    startTransition(() => router.refresh());
  }

  return (
    <div
      role="group"
      aria-label={t("language")}
      aria-busy={pending}
      className={cn(
        "inline-flex rounded-lg border p-0.5",
        tone === "dark" ? "border-cream-50/30" : "border-cream-300 bg-white",
        className,
      )}
    >
      {routing.locales.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            lang={code}
            aria-pressed={active}
            onClick={() => choose(code)}
            className={cn(
              "min-h-9 flex-1 rounded-md px-3 text-sm font-bold transition-colors",
              tone === "dark"
                ? active
                  ? "bg-cream-50 text-forest-900"
                  : "text-cream-50/85 hover:bg-cream-50/10 hover:text-white"
                : active
                  ? "bg-forest-700 text-white"
                  : "text-forest-900 hover:bg-forest-100",
            )}
          >
            {NAMES[code]}
          </button>
        );
      })}
    </div>
  );
}
