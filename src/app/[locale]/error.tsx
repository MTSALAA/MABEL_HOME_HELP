"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { buttonStyles } from "@/components/public/button-link";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Error");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="bg-cream-50 py-20 md:py-28">
      <div className="page-container flex flex-col items-center text-center">
        <h1 className="text-[2.5rem] leading-tight font-bold text-forest-900 md:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-4 max-w-xl text-xl text-ink-muted">{t("body")}</p>
        <button
          type="button"
          onClick={reset}
          className={`${buttonStyles({ variant: "primary", size: "lg" })} mt-8`}
        >
          {t("retry")}
        </button>
      </div>
    </section>
  );
}
