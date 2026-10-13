import { Suspense, type ReactNode } from "react";
import { Logo } from "@/components/public/logo";
import { getAdminT } from "@/server/admin-i18n";
import { AdminIntl } from "./intl";
import { LanguageSwitch } from "./language-switch";

export type AuthScreen = "login" | "forgot" | "reset";

async function Card({
  screen,
  children,
}: {
  screen: AuthScreen;
  children: ReactNode;
}) {
  const t = await getAdminT("Auth");
  return (
    <>
      <div className="mt-8 w-full max-w-sm rounded-2xl border border-cream-300 bg-white p-7 shadow-soft">
        <h1 className="text-2xl font-bold text-forest-900">{t(`${screen}.title`)}</h1>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">
          {t(`${screen}.description`)}
        </p>
        {children}
      </div>
      <LanguageSwitch className="mt-6" />
    </>
  );
}

/**
 * Centered card used by the sign-in and password pages. The text depends on
 * the admin's language (a cookie), so it streams in behind the logo.
 */
export function AuthCard({
  screen,
  children,
}: {
  screen: AuthScreen;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-cream-100 px-4 py-10">
      <Logo />
      <Suspense
        fallback={
          <div
            className="mt-8 h-96 w-full max-w-sm rounded-2xl border border-cream-300 bg-white shadow-soft"
            aria-busy="true"
          />
        }
      >
        <AdminIntl>
          <Card screen={screen}>{children}</Card>
        </AdminIntl>
      </Suspense>
    </main>
  );
}
