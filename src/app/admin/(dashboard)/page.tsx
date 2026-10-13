import { TriangleAlertIcon } from "lucide-react";
import Link from "next/link";
import { after } from "next/server";
import { PageHeader, Panel, StatusBadge } from "@/components/admin/ui";
import { pick } from "@/lib/localize";
import { formatPhone } from "@/lib/phone";
import {
  getAdminFormat,
  getAdminLabels,
  getAdminLocale,
  getAdminT,
} from "@/server/admin-i18n";
import { isEmailConfigured } from "@/server/email/send";
import { runHousekeeping } from "@/server/housekeeping";
import { getOverview } from "@/server/queries/admin";
import { hasSharedRateLimit } from "@/server/rate-limit";
import { requireAdmin } from "@/server/session";
import { isStripeEnabled, missingStripeConfig } from "@/server/stripe";
import { isTurnstileEnabled } from "@/server/turnstile";

export async function generateMetadata() {
  const t = await getAdminT("Nav");
  return { title: t("overview") };
}

// Admin pages wait on the session by design (see the dashboard layout).
export const instant = false;

function Stat({
  label,
  value,
  href,
  tone = "default",
}: {
  label: string;
  value: number;
  href: string;
  tone?: "default" | "alert";
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-cream-300 bg-white p-5 shadow-soft transition-shadow hover:shadow-lift"
    >
      <p className="text-sm font-bold text-muted-foreground">{label}</p>
      <p
        className={
          tone === "alert" && value > 0
            ? "mt-1 font-display text-4xl font-bold text-danger"
            : "mt-1 font-display text-4xl font-bold text-forest-900"
        }
      >
        {value}
      </p>
    </Link>
  );
}

export default async function OverviewPage() {
  const admin = await requireAdmin();
  const [overview, locale, t, tCommon, labels, format] = await Promise.all([
    getOverview(),
    getAdminLocale(),
    getAdminT("Overview"),
    getAdminT("Common"),
    getAdminLabels(),
    getAdminFormat(),
  ]);
  // Routine clean-up runs after the page has been sent (see housekeeping.ts).
  after(runHousekeeping);

  const warnings: { text: string; href?: string; action?: string }[] = [];
  const isProduction = process.env.NODE_ENV === "production";

  // Missing set-up that would otherwise fail silently. These are fixed in the
  // hosting settings, not here, so they have no link.
  if (isProduction && !isEmailConfigured()) {
    warnings.push({
      text: t("warnings.email"),
    });
  }
  if (isProduction && isEmailConfigured() && !process.env.EMAIL_FROM) {
    warnings.push({
      text: t("warnings.sender"),
    });
  }
  if (isProduction && !isTurnstileEnabled()) {
    warnings.push({
      text: t("warnings.spam"),
    });
  }
  if (isProduction && !hasSharedRateLimit()) {
    warnings.push({
      text: t("warnings.rateLimit"),
    });
  }

  if (overview.missingPhone) {
    warnings.push({
      text: t("warnings.phone"),
      href: "/admin/settings",
      action: t("warnings.phoneAction"),
    });
  }
  if (overview.missingEmail) {
    warnings.push({
      text: t("warnings.businessEmail"),
      href: "/admin/settings",
      action: t("warnings.businessEmailAction"),
    });
  }
  const stripeGap = missingStripeConfig();
  if (stripeGap === "all") {
    warnings.push({
      text: t("warnings.stripe"),
      href: "/admin/plans",
      action: t("warnings.stripeAction"),
    });
  } else if (stripeGap === "webhook") {
    warnings.push({
      text: t("warnings.stripeWebhook"),
    });
  }
  // Only meaningful once Stripe is connected; before that the warning above
  // already covers every plan.
  for (const plan of isStripeEnabled() ? overview.plansMissingPrice : []) {
    warnings.push({
      text: t("warnings.planPrice", {
        plan: pick(locale, plan.nameEn, plan.nameFr),
      }),
      href: `/admin/plans/${plan.id}`,
      action: t("warnings.planPriceAction"),
    });
  }

  return (
    <>
      <PageHeader
        title={t("hello", { name: admin.name.split(" ")[0] })}
        description={t("lead")}
      />

      {warnings.length > 0 ? (
        <ul className="mb-6 flex flex-col gap-3">
          {warnings.map((warning) => (
            <li
              key={warning.text}
              className="flex flex-col gap-2 rounded-xl border-2 border-honey bg-honey-soft p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="flex items-start gap-2.5 font-bold text-forest-950">
                <TriangleAlertIcon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                {warning.text}
              </p>
              {warning.href && warning.action ? (
                <Link
                  href={warning.href}
                  className="shrink-0 font-bold text-forest-900 underline underline-offset-4"
                >
                  {warning.action}
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label={t("stats.newRequests")} value={overview.newRequests} href="/admin/requests?status=NEW" />
        <Stat label={t("stats.requestsThisWeek")} value={overview.requestsThisWeek} href="/admin/requests" />
        <Stat label={t("stats.activeMembers")} value={overview.activeMembers} href="/admin/members?status=ACTIVE" />
        <Stat
          label={t("stats.pastDueMembers")}
          value={overview.pastDueMembers}
          href="/admin/members?status=PAST_DUE"
          tone="alert"
        />
        <Stat label={t("stats.newSponsors")} value={overview.newSponsors} href="/admin/sponsors?status=NEW" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title={t("latestRequests")}>
          {overview.recentRequests.length === 0 ? (
            <p className="text-muted-foreground">{t("noRequests")}</p>
          ) : (
            <ul className="divide-y divide-cream-300">
              {overview.recentRequests.map((request) => (
                <li key={request.id}>
                  <Link
                    href={`/admin/requests/${request.id}`}
                    className="flex items-center justify-between gap-3 rounded-md py-3 hover:bg-cream-50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-bold text-forest-900">
                        {request.fullName}
                      </span>
                      <span className="block truncate text-sm text-muted-foreground">
                        {request.service
                          ? pick(locale, request.service.titleEn, request.service.titleFr)
                          : request.type === "GENERAL"
                            ? labels("GENERAL")
                            : tCommon("notSure")}{" "}
                        · {formatPhone(request.phone)} · {format.dateTime(request.createdAt)}
                      </span>
                    </span>
                    <StatusBadge status={request.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={t("latestMemberships")}>
          {overview.recentMemberships.length === 0 ? (
            <p className="text-muted-foreground">{t("noMemberships")}</p>
          ) : (
            <ul className="divide-y divide-cream-300">
              {overview.recentMemberships.map((membership) => (
                <li key={membership.id}>
                  <Link
                    href={`/admin/members/${membership.id}`}
                    className="flex items-center justify-between gap-3 rounded-md py-3 hover:bg-cream-50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-bold text-forest-900">
                        {membership.payerName}
                      </span>
                      <span className="block truncate text-sm text-muted-foreground">
                        {pick(locale, membership.plan.nameEn, membership.plan.nameFr)} ·{" "}
                        {format.dateTime(membership.createdAt)}
                      </span>
                    </span>
                    <StatusBadge status={membership.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
