import {
  ExternalLinkIcon,
  MailIcon,
  MessageSquareTextIcon,
  PhoneIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConfirmAction, NotesForm } from "@/components/admin/detail-controls";
import {
  DetailList,
  formatDateTime,
  formatDay,
  label,
  PageHeader,
  Panel,
  StatusBadge,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { formatCad } from "@/lib/money";
import { formatPhone, smsHref, telHref } from "@/lib/phone";
import {
  cancelMembership,
  updateMembershipNotes,
} from "@/server/actions/admin/inbox";
import { prisma } from "@/server/db";
import { reportError } from "@/server/report-error";
import { requireAdmin } from "@/server/session";
import { getPeriodEnd, getStripe } from "@/server/stripe";

export const metadata: Metadata = { title: "Member" };

// Admin pages wait on the session by design (see the dashboard layout).
export const instant = false;

/** Live billing facts from Stripe, the source of truth. Null if unreachable. */
async function getLiveBilling(subscriptionId: string | null) {
  const stripe = getStripe();
  if (!stripe || !subscriptionId) return null;
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const price = subscription.items.data[0]?.price;
    return {
      status: subscription.status,
      amountCents: price?.unit_amount ?? null,
      periodEnd: getPeriodEnd(subscription),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    };
  } catch (error) {
    reportError(error, "admin.member.liveBilling");
    return null;
  }
}

export default async function MemberDetailPage({
  params,
}: PageProps<"/admin/members/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const membership = await prisma.membership.findUnique({
    where: { id },
    include: { plan: true },
  });
  if (!membership) notFound();

  const live = await getLiveBilling(membership.stripeSubscriptionId);
  const amountCents = live?.amountCents ?? membership.plan.monthlyCents;
  const periodEnd = live?.periodEnd ?? membership.currentPeriodEnd;
  const cancelScheduled = live?.cancelAtPeriodEnd ?? membership.cancelAtPeriodEnd;
  const ended = membership.status === "CANCELED";
  const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") ?? false;
  const stripeCustomerUrl = membership.stripeCustomerId
    ? `https://dashboard.stripe.com/${isTestMode ? "test/" : ""}customers/${membership.stripeCustomerId}`
    : null;
  const forSelf = membership.requesterRole === "SELF";

  return (
    <>
      <PageHeader
        title={membership.payerName}
        description={`${membership.plan.nameEn} · joined ${formatDay(membership.createdAt)}`}
        backHref="/admin/members"
        backLabel="All members"
      >
        <StatusBadge status={membership.status} />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex min-w-0 flex-col gap-6">
          <Panel title="Contact the payer">
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <a href={telHref(membership.payerPhone)}>
                  <PhoneIcon aria-hidden="true" />
                  Call {formatPhone(membership.payerPhone)}
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={smsHref(membership.payerPhone)}>
                  <MessageSquareTextIcon aria-hidden="true" />
                  Text
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={`mailto:${membership.payerEmail}`}>
                  <MailIcon aria-hidden="true" />
                  Email
                </a>
              </Button>
            </div>
          </Panel>

          <Panel title="Who and where">
            <DetailList
              rows={[
                { label: "Payer", value: membership.payerName },
                { label: "Payer phone", value: formatPhone(membership.payerPhone) },
                { label: "Payer email", value: membership.payerEmail },
                {
                  label: "Visits are for",
                  value: forSelf
                    ? "The payer"
                    : (membership.recipientName ?? label(membership.requesterRole)),
                },
                {
                  label: "Recipient phone",
                  value: membership.recipientPhone ? (
                    <a
                      href={telHref(membership.recipientPhone)}
                      className="text-forest-700 underline underline-offset-4"
                    >
                      {formatPhone(membership.recipientPhone)}
                    </a>
                  ) : null,
                },
                { label: "Service address", value: membership.serviceAddress },
                { label: "Area", value: membership.area },
                { label: "Notes from sign-up", value: membership.notes },
                { label: "Language", value: label(membership.locale) },
                { label: "Terms accepted", value: formatDateTime(membership.consentAt) },
              ]}
            />
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Panel
            title="Billing"
            description={
              live
                ? "Live from Stripe."
                : "From the last update Stripe sent. Live details are unavailable right now."
            }
          >
            <DetailList
              rows={[
                { label: "Plan", value: membership.plan.nameEn },
                {
                  label: "Amount",
                  value:
                    amountCents !== null ? `${formatCad(amountCents, "en")} per month` : null,
                },
                { label: "Stripe status", value: live?.status ?? label(membership.status) },
                {
                  label: ended
                    ? "Ended"
                    : cancelScheduled
                      ? "Ends on"
                      : "Next billing date",
                  value: ended
                    ? formatDay(membership.canceledAt)
                    : formatDay(periodEnd),
                },
                {
                  label: "Cancellation",
                  value: ended
                    ? null
                    : cancelScheduled
                      ? "Scheduled for the end of the paid period"
                      : "Not scheduled",
                },
              ]}
            />
            <div className="mt-4 flex flex-col items-start gap-3">
              {stripeCustomerUrl ? (
                <Button asChild variant="outline">
                  <a href={stripeCustomerUrl} target="_blank" rel="noreferrer">
                    <ExternalLinkIcon aria-hidden="true" />
                    Open in Stripe
                  </a>
                </Button>
              ) : null}
              {!ended && !cancelScheduled && membership.stripeSubscriptionId ? (
                <ConfirmAction
                  trigger={<Button variant="destructive">Cancel at period end</Button>}
                  title="Cancel this membership?"
                  description={`${membership.payerName} keeps their visits until ${formatDay(periodEnd) || "the end of the paid period"}, then billing stops. Refunds and immediate cancellation are done in the Stripe dashboard.`}
                  confirmLabel="Cancel membership"
                  successMessage="Cancellation scheduled."
                  action={cancelMembership.bind(null, membership.id)}
                />
              ) : null}
            </div>
          </Panel>

          <Panel>
            <NotesForm
              initial={membership.adminNotes ?? ""}
              action={updateMembershipNotes.bind(null, membership.id)}
            />
          </Panel>
        </div>
      </div>
    </>
  );
}
