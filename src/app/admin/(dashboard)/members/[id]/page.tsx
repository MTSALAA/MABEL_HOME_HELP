import {
  ExternalLinkIcon,
  MailIcon,
  MessageSquareTextIcon,
  PhoneIcon,
} from "lucide-react";
import { notFound } from "next/navigation";
import { ConfirmAction, NotesForm } from "@/components/admin/detail-controls";
import {
  DetailList,
  PageHeader,
  Panel,
  StatusBadge,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { pick } from "@/lib/localize";
import { formatCad } from "@/lib/money";
import { formatPhone, smsHref, telHref } from "@/lib/phone";
import {
  cancelMembership,
  updateMembershipNotes,
} from "@/server/actions/admin/inbox";
import {
  getAdminFormat,
  getAdminLabels,
  getAdminLocale,
  getAdminT,
} from "@/server/admin-i18n";
import { prisma } from "@/server/db";
import { reportError } from "@/server/report-error";
import { requireAdmin } from "@/server/session";
import { getPeriodEnd, getStripe } from "@/server/stripe";

export async function generateMetadata() {
  const t = await getAdminT("Members");
  return { title: t("detailTitle") };
}

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

  const [locale, t, tCommon, labels, format] = await Promise.all([
    getAdminLocale(),
    getAdminT("Members"),
    getAdminT("Common"),
    getAdminLabels(),
    getAdminFormat(),
  ]);

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
  const planName = pick(locale, membership.plan.nameEn, membership.plan.nameFr);
  const periodEndDay = format.day(periodEnd);

  return (
    <>
      <PageHeader
        title={membership.payerName}
        description={t("joined", {
          plan: planName,
          date: format.day(membership.createdAt),
        })}
        backHref="/admin/members"
        backLabel={t("backToList")}
      >
        <StatusBadge status={membership.status} />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex min-w-0 flex-col gap-6">
          <Panel title={t("contactPayer")}>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <a href={telHref(membership.payerPhone)}>
                  <PhoneIcon aria-hidden="true" />
                  {tCommon("callNumber", { phone: formatPhone(membership.payerPhone) })}
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={smsHref(membership.payerPhone)}>
                  <MessageSquareTextIcon aria-hidden="true" />
                  {tCommon("sendText")}
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={`mailto:${membership.payerEmail}`}>
                  <MailIcon aria-hidden="true" />
                  {tCommon("sendEmail")}
                </a>
              </Button>
            </div>
          </Panel>

          <Panel title={t("whoAndWhere")}>
            <DetailList
              rows={[
                { label: t("fields.payer"), value: membership.payerName },
                { label: t("fields.payerPhone"), value: formatPhone(membership.payerPhone) },
                { label: t("fields.payerEmail"), value: membership.payerEmail },
                {
                  label: t("fields.visitsAreFor"),
                  value: forSelf
                    ? t("thePayer")
                    : (membership.recipientName ?? labels(membership.requesterRole)),
                },
                {
                  label: t("fields.recipientPhone"),
                  value: membership.recipientPhone ? (
                    <a
                      href={telHref(membership.recipientPhone)}
                      className="text-forest-700 underline underline-offset-4"
                    >
                      {formatPhone(membership.recipientPhone)}
                    </a>
                  ) : null,
                },
                { label: t("fields.serviceAddress"), value: membership.serviceAddress },
                { label: t("fields.area"), value: membership.area },
                { label: t("fields.notesFromSignUp"), value: membership.notes },
                { label: t("fields.language"), value: labels(membership.locale) },
                { label: t("fields.termsAccepted"), value: format.dateTime(membership.consentAt) },
              ]}
            />
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Panel
            title={t("billing.title")}
            description={live ? t("billing.live") : t("billing.stale")}
          >
            <DetailList
              rows={[
                { label: t("fields.plan"), value: planName },
                {
                  label: t("billing.amount"),
                  value:
                    amountCents !== null
                      ? t("billing.perMonth", { price: formatCad(amountCents, locale) })
                      : null,
                },
                {
                  label: t("billing.stripeStatus"),
                  value: live?.status ?? labels(membership.status),
                },
                {
                  label: ended
                    ? t("billing.ended")
                    : cancelScheduled
                      ? t("billing.endsOn")
                      : t("billing.nextBillingDate"),
                  value: ended
                    ? format.day(membership.canceledAt)
                    : periodEndDay,
                },
                {
                  label: t("billing.cancellation"),
                  value: ended
                    ? null
                    : cancelScheduled
                      ? t("billing.cancellationScheduled")
                      : t("billing.cancellationNotScheduled"),
                },
              ]}
            />
            <div className="mt-4 flex flex-col items-start gap-3">
              {stripeCustomerUrl ? (
                <Button asChild variant="outline">
                  <a href={stripeCustomerUrl} target="_blank" rel="noreferrer">
                    <ExternalLinkIcon aria-hidden="true" />
                    {t("billing.openInStripe")}
                  </a>
                </Button>
              ) : null}
              {!ended && !cancelScheduled && membership.stripeSubscriptionId ? (
                <ConfirmAction
                  trigger={<Button variant="destructive">{t("cancel.button")}</Button>}
                  title={t("cancel.title")}
                  description={
                    periodEndDay
                      ? t("cancel.description", {
                          name: membership.payerName,
                          date: periodEndDay,
                        })
                      : t("cancel.descriptionNoDate", { name: membership.payerName })
                  }
                  confirmLabel={t("cancel.confirm")}
                  successMessage={t("cancel.success")}
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
