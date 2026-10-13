import { TriangleAlertIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { after } from "next/server";
import {
  formatDateTime,
  PageHeader,
  Panel,
  StatusBadge,
} from "@/components/admin/ui";
import { formatPhone } from "@/lib/phone";
import { isEmailConfigured } from "@/server/email/send";
import { runHousekeeping } from "@/server/housekeeping";
import { getOverview } from "@/server/queries/admin";
import { hasSharedRateLimit } from "@/server/rate-limit";
import { requireAdmin } from "@/server/session";
import { isStripeEnabled, missingStripeConfig } from "@/server/stripe";
import { isTurnstileEnabled } from "@/server/turnstile";

export const metadata: Metadata = { title: "Overview" };

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
  const overview = await getOverview();
  // Routine clean-up runs after the page has been sent (see housekeeping.ts).
  after(runHousekeeping);

  const warnings: { text: string; href?: string; action?: string }[] = [];
  const isProduction = process.env.NODE_ENV === "production";

  // Missing set-up that would otherwise fail silently. These are fixed in the
  // hosting settings, not here, so they have no link.
  if (isProduction && !isEmailConfigured()) {
    warnings.push({
      text: "Email sending is not set up (RESEND_API_KEY). Requests are saved here, but no notification or confirmation emails are being sent.",
    });
  }
  if (isProduction && isEmailConfigured() && !process.env.EMAIL_FROM) {
    warnings.push({
      text: "No sender address is set (EMAIL_FROM), so emails go out from a test address that most visitors will never receive.",
    });
  }
  if (isProduction && !isTurnstileEnabled()) {
    warnings.push({
      text: "Spam protection is not set up (Turnstile keys). The forms are only protected by basic checks.",
    });
  }
  if (isProduction && !hasSharedRateLimit()) {
    warnings.push({
      text: "Rate limiting is not connected to Upstash, so the limits on forms and sign-in are weaker than intended.",
    });
  }

  if (overview.missingPhone) {
    warnings.push({
      text: "No phone number is set, so the Call Now and Text Us buttons are hidden on the website.",
      href: "/admin/settings",
      action: "Add the phone number",
    });
  }
  if (overview.missingEmail) {
    warnings.push({
      text: "No business email is set. Notifications have nowhere to go unless notification emails are listed.",
      href: "/admin/settings",
      action: "Add the email",
    });
  }
  const stripeGap = missingStripeConfig();
  if (stripeGap === "all") {
    warnings.push({
      text: "Stripe is not connected, so memberships can't be bought online yet. Visitors see “Request this plan” instead.",
      href: "/admin/plans",
      action: "Review plans",
    });
  } else if (stripeGap === "webhook") {
    warnings.push({
      text: "Stripe is only half connected: the webhook secret (STRIPE_WEBHOOK_SECRET) is missing. Online purchase stays switched off until it is set, so nobody can pay without being recorded.",
    });
  }
  // Only meaningful once Stripe is connected; before that the warning above
  // already covers every plan.
  for (const plan of isStripeEnabled() ? overview.plansMissingPrice : []) {
    warnings.push({
      text: `“${plan.nameEn}” is marked Buy online but has no Stripe price yet.`,
      href: `/admin/plans/${plan.id}`,
      action: "Open the plan and save it",
    });
  }

  return (
    <>
      <PageHeader
        title={`Hello, ${admin.name.split(" ")[0]}`}
        description="Here's what needs your attention."
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
        <Stat label="New requests" value={overview.newRequests} href="/admin/requests?status=NEW" />
        <Stat label="Requests this week" value={overview.requestsThisWeek} href="/admin/requests" />
        <Stat label="Active members" value={overview.activeMembers} href="/admin/members?status=ACTIVE" />
        <Stat
          label="Past-due members"
          value={overview.pastDueMembers}
          href="/admin/members?status=PAST_DUE"
          tone="alert"
        />
        <Stat label="New sponsor inquiries" value={overview.newSponsors} href="/admin/sponsors?status=NEW" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Latest requests">
          {overview.recentRequests.length === 0 ? (
            <p className="text-muted-foreground">No requests yet.</p>
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
                        {request.service?.titleEn ??
                          (request.type === "GENERAL" ? "Message" : "Not sure yet")}{" "}
                        · {formatPhone(request.phone)} · {formatDateTime(request.createdAt)}
                      </span>
                    </span>
                    <StatusBadge status={request.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Latest memberships">
          {overview.recentMemberships.length === 0 ? (
            <p className="text-muted-foreground">No memberships yet.</p>
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
                        {membership.plan.nameEn} · {formatDateTime(membership.createdAt)}
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
