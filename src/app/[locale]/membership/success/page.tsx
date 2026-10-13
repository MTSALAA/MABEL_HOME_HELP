import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ButtonLink } from "@/components/public/button-link";
import { Illustration } from "@/components/public/cards";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { formatDate } from "@/lib/locale";
import { pick } from "@/lib/localize";
import { pageMetadata } from "@/lib/metadata";
import { formatCad } from "@/lib/money";
import { prisma } from "@/server/db";

type Props = PageProps<"/[locale]/membership/success">;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Membership.success");
  return pageMetadata({
    locale,
    path: "/membership/success",
    title: t("metaTitle"),
    noIndex: true,
  });
}

/**
 * Shows the membership that belongs to the Checkout session in the URL. The
 * page never activates anything: only the Stripe webhook does. If the webhook
 * has not arrived yet, a "being confirmed" message is shown instead.
 */
async function Summary({
  searchParams,
  locale,
}: Pick<Props, "searchParams"> & { locale: AppLocale }) {
  const t = await getTranslations("Membership.success");
  const sessionId = (await searchParams).session_id;

  const membership =
    typeof sessionId === "string" && sessionId.length < 200
      ? await prisma.membership.findUnique({
          where: { stripeCheckoutSessionId: sessionId },
          include: { plan: true },
        })
      : null;

  if (!membership || membership.status !== "ACTIVE") {
    return <p className="mt-4 max-w-xl text-xl text-ink-muted">{t("pendingBody")}</p>;
  }

  const rows = [
    {
      label: t("plan"),
      value: pick(locale, membership.plan.nameEn, membership.plan.nameFr),
    },
    ...(membership.plan.monthlyCents !== null
      ? [
          {
            label: t("amount"),
            value: formatCad(membership.plan.monthlyCents, locale),
          },
        ]
      : []),
    ...(membership.currentPeriodEnd
      ? [
          {
            label: t("nextBilling"),
            value: formatDate(membership.currentPeriodEnd, locale),
          },
        ]
      : []),
  ];

  return (
    <>
      <p className="mt-4 max-w-xl text-xl text-ink-muted">{t("body")}</p>
      <dl className="mt-8 w-full max-w-md divide-y divide-cream-300 rounded-2xl border border-cream-300 bg-white text-left">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-6 px-5 py-4">
            <dt className="text-ink-muted">{row.label}</dt>
            <dd className="text-right font-bold text-forest-900">{row.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-5 max-w-md text-ink-muted">
        {t("receipt", { email: membership.payerEmail })}
      </p>
    </>
  );
}

export default async function MembershipSuccessPage({ searchParams }: Props) {
  const locale = await getLocale();
  const t = await getTranslations("Membership.success");
  const tCommon = await getTranslations("Common");

  return (
    <section className="bg-cream-50 py-16 md:py-24">
      <div className="page-container flex flex-col items-center text-center">
        <Illustration name="success" width={200} height={160} className="h-44 w-auto" />
        <h1 className="mt-6 text-[2.5rem] leading-tight font-bold text-forest-900 md:text-5xl">
          {t("title")}
        </h1>
        <Suspense
          fallback={
            <p className="mt-4 max-w-xl text-xl text-ink-muted">{tCommon("loading")}</p>
          }
        >
          <Summary searchParams={searchParams} locale={locale} />
        </Suspense>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <ButtonLink href="/">{tCommon("backHome")}</ButtonLink>
          <Link
            href="/membership/manage"
            className="inline-flex min-h-12 items-center rounded-lg font-bold text-forest-700 underline underline-offset-4"
          >
            {t("manage")}
          </Link>
        </div>
      </div>
    </section>
  );
}
