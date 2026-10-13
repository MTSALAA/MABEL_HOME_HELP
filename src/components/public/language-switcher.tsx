"use client";

import { GlobeIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Switches language while staying on the same page. Shown as the language's
 * own name (no flags), which is what a reader of that language looks for.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations("Nav");
  const locale = useLocale();
  const pathname = usePathname();
  const target = locale === "fr" ? "en" : "fr";

  return (
    <Link
      href={pathname}
      locale={target}
      hrefLang={target}
      lang={target}
      aria-label={`${t("languageLabel")}: ${t("switchTo")}`}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-base font-bold text-forest-900 transition-colors hover:bg-forest-100",
        className,
      )}
    >
      <GlobeIcon className="size-5" aria-hidden="true" />
      {t("switchTo")}
    </Link>
  );
}
