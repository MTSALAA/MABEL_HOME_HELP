import { CircleAlertIcon } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ManageForm } from "@/components/forms/manage-form";
import { PageHero, Section } from "@/components/public/section";
import type { AppLocale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/metadata";
import { formatPhone, telHref } from "@/lib/phone";
import { verifyPortalToken } from "@/server/portal-token";
import { getSettings } from "@/server/queries/content";
import { reportError } from "@/server/report-error";
import { createPortalUrl, isStripeEnabled } from "@/server/stripe";

type Props = PageProps<"/[locale]/membership/manage">;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Membership.manage");
  return pageMetadata({
    locale,
    path: "/membership/manage",
    title: t("metaTitle"),
    noIndex: true,
  });
}

/**
 * Handles the emailed link: a valid, unexpired token is exchanged for a fresh
 * Stripe billing portal session and the member is sent straight there.
 */
async function TokenGate({
  searchParams,
  locale,
}: Pick<Props, "searchParams"> & { locale: AppLocale }) {
  const t = await getTranslations("Membership.manage");
  const token = (await searchParams).token;
  if (typeof token !== "string") return null;

  const customerId = verifyPortalToken(token);
  let portalUrl: string | null = null;
  if (customerId && isStripeEnabled()) {
    try {
      portalUrl = await createPortalUrl(customerId, locale);
    } catch (error) {
      reportError(error, "membership.manage.portal");
    }
  }
  // redirect() throws, so it must stay outside the try/catch above.
  if (portalUrl) redirect(portalUrl);

  return (
    <p
      role="alert"
      className="mb-6 flex items-start gap-2.5 rounded-xl border-2 border-honey bg-honey-soft p-4 text-lg font-bold text-forest-950"
    >
      <CircleAlertIcon className="mt-0.5 size-6 shrink-0" aria-hidden="true" />
      {t("expired")}
    </p>
  );
}

export default async function ManageMembershipPage({ searchParams }: Props) {
  const locale = await getLocale();
  const t = await getTranslations("Membership.manage");
  const settings = await getSettings(locale);

  return (
    <>
      <PageHero title={t("title")} lead={t("lead")} />
      <Section tone="cream" className="md:py-16">
        <div className="mx-auto max-w-xl">
          <Suspense fallback={null}>
            <TokenGate searchParams={searchParams} locale={locale} />
          </Suspense>
          <div className="rounded-3xl border border-cream-300 bg-white p-6 shadow-soft md:p-9">
            <ManageForm />
          </div>
          <p className="mt-6 text-ink-muted">
            {t("help")}{" "}
            {settings.phone ? (
              <a
                href={telHref(settings.phone)}
                className="font-bold whitespace-nowrap text-forest-700 underline underline-offset-4"
              >
                {formatPhone(settings.phone)}
              </a>
            ) : null}
          </p>
        </div>
      </Section>
    </>
  );
}
