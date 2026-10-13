import Link from "next/link";
import { Suspense } from "react";
import { getAdminT } from "@/server/admin-i18n";

async function Message() {
  const t = await getAdminT("Errors");
  return (
    <>
      <h1 className="text-3xl font-bold text-forest-900">{t("notFoundTitle")}</h1>
      <p className="max-w-md text-muted-foreground">{t("notFoundText")}</p>
      <Link
        href="/admin"
        className="font-bold text-forest-700 underline underline-offset-4"
      >
        {t("notFoundLink")}
      </Link>
    </>
  );
}

export default function AdminNotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      {/* The wording follows the admin's language, which is read from a cookie. */}
      <Suspense fallback={null}>
        <Message />
      </Suspense>
    </main>
  );
}
