import { CheckIcon, LockIcon, PhoneCallIcon, RefreshCwIcon } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MembershipForm } from "@/components/forms/membership-form";
import { ButtonLink } from "@/components/public/button-link";
import { ScopeNote } from "@/components/public/cards";
import { PageHero, Section } from "@/components/public/section";
import { pageMetadata } from "@/lib/metadata";
import { formatCad } from "@/lib/money";
import {
  getActivePlanSlugs,
  getPlanBySlug,
  getSettings,
} from "@/server/queries/content";

type Props = PageProps<"/[locale]/membership/[plan]">;

export async function generateStaticParams() {
  const slugs = await getActivePlanSlugs();
  // Cache Components needs at least one value to validate the route.
  return (slugs.length > 0 ? slugs : ["none"]).map((plan) => ({ plan }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { plan: slug } = await params;
  const locale = await getLocale();
  const t = await getTranslations("Membership");
  const plan = await getPlanBySlug(slug, locale);
  return pageMetadata({
    locale,
    path: `/membership/${slug}`,
    title: plan ? t("metaTitle", { plan: plan.name }) : t("genericMetaTitle"),
    noIndex: true,
  });
}

async function MembershipContent({ params }: Pick<Props, "params">) {
  const { plan: slug } = await params;
  const locale = await getLocale();
  const t = await getTranslations("Membership");
  const [settings, plan] = await Promise.all([
    getSettings(locale),
    getPlanBySlug(slug, locale),
  ]);

  if (!plan) notFound();

  // The plan exists but can't be bought online (not purchasable, or Stripe is
  // not configured): offer the request form instead of a dead end.
  if (!plan.canBuyOnline || plan.monthlyCents === null) {
    return (
      <>
        <PageHero
          title={t("unavailableTitle")}
          lead={t("unavailableBody")}
        >
          <div className="mt-8">
            <ButtonLink href={{ pathname: "/book", query: { plan: plan.slug } }}>
              {t("unavailableCta")}
            </ButtonLink>
          </div>
        </PageHero>
      </>
    );
  }

  const price = formatCad(plan.monthlyCents, locale);

  return (
    <>
      <PageHero title={t("title", { plan: plan.name })} lead={t("lead")} />

      <Section tone="cream" className="md:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-14">
          <div className="flex min-w-0 flex-col gap-6">
            {/* On phones the full summary sits below the form, so what is
                being bought, and for how much, is stated here first. */}
            <p className="rounded-2xl bg-forest-900 px-5 py-4 text-cream-50 lg:hidden">
              <span className="block text-lg font-bold">{plan.name}</span>
              <span className="block font-display text-2xl font-bold text-honey">
                {t("perMonth", { price })}
              </span>
              <span className="block">{plan.includes}</span>
            </p>
            <div className="rounded-3xl border border-cream-300 bg-white p-6 shadow-soft md:p-9">
              <MembershipForm
                planSlug={plan.slug}
                areas={settings.serviceAreaValues.map((value, index) => ({
                  value,
                  label: settings.serviceAreas[index] ?? value,
                }))}
              />
            </div>
          </div>

          <aside className="flex flex-col gap-6 lg:pt-2">
            <div className="rounded-3xl bg-forest-900 p-7 text-cream-50">
              <h2 className="text-base font-bold tracking-[0.12em] text-honey uppercase">
                {t("summaryTitle")}
              </h2>
              <p className="mt-3 text-2xl font-bold">{plan.name}</p>
              <p className="mt-1 font-display text-[2rem] leading-tight font-bold text-honey">
                {t("perMonth", { price })}
              </p>
              <p className="mt-3 flex items-start gap-2.5 text-lg font-bold">
                <CheckIcon className="mt-1 size-5 shrink-0 text-honey" aria-hidden="true" />
                {plan.includes}
              </p>
              <ul className="mt-6 flex flex-col gap-4 border-t border-cream-50/20 pt-6 text-[1.0625rem]">
                <li className="flex gap-3">
                  <RefreshCwIcon className="mt-1 size-5 shrink-0 text-forest-300" aria-hidden="true" />
                  {t("summaryRenew")}
                </li>
                <li className="flex gap-3">
                  <PhoneCallIcon className="mt-1 size-5 shrink-0 text-forest-300" aria-hidden="true" />
                  {t("summaryNext")}
                </li>
                <li className="flex gap-3">
                  <LockIcon className="mt-1 size-5 shrink-0 text-forest-300" aria-hidden="true" />
                  {t("summarySecure")}
                </li>
              </ul>
            </div>
            <ScopeNote text={settings.disclaimer} />
          </aside>
        </div>
      </Section>
    </>
  );
}

export default function MembershipPage({ params }: Props) {
  return (
    // The plan slug is read inside the boundary so unknown slugs can still be
    // served from the shared shell.
    <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>
      <MembershipContent params={params} />
    </Suspense>
  );
}
