"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Admin.Errors");
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-xl border border-danger bg-danger-soft p-6"
    >
      <h1 className="text-2xl font-bold text-danger">{t("screenTitle")}</h1>
      <p className="max-w-xl text-ink">
        {t("screenText")}
      </p>
      {error.digest ? (
        <p className="text-sm text-ink-muted">{t("reference", { code: error.digest })}</p>
      ) : null}
      <Button onClick={reset}>{t("tryAgain")}</Button>
    </div>
  );
}
