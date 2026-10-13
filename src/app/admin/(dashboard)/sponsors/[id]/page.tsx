import { MailIcon, PhoneIcon, Trash2Icon } from "lucide-react";
import { notFound } from "next/navigation";
import {
  ConfirmAction,
  NotesForm,
  StatusSelect,
} from "@/components/admin/detail-controls";
import {
  DetailList,
  PageHeader,
  Panel,
  StatusBadge,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { formatPhone, telHref } from "@/lib/phone";
import {
  deleteSponsor,
  updateSponsorNotes,
  updateSponsorStatus,
} from "@/server/actions/admin/inbox";
import { getAdminFormat, getAdminLabels, getAdminT } from "@/server/admin-i18n";
import { prisma } from "@/server/db";
import { SPONSOR_STATUSES } from "@/server/queries/admin";
import { requireAdmin } from "@/server/session";

export async function generateMetadata() {
  const t = await getAdminT("Sponsors");
  return { title: t("detailTitle") };
}

// Admin pages wait on the session by design (see the dashboard layout).
export const instant = false;

export default async function SponsorDetailPage({
  params,
}: PageProps<"/admin/sponsors/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const inquiry = await prisma.sponsorInquiry.findUnique({ where: { id } });
  if (!inquiry) notFound();

  const [t, tCommon, labels, format] = await Promise.all([
    getAdminT("Sponsors"),
    getAdminT("Common"),
    getAdminLabels(),
    getAdminFormat(),
  ]);

  return (
    <>
      <PageHeader
        title={inquiry.fullName}
        description={t("received", { date: format.dateTime(inquiry.createdAt) })}
        backHref="/admin/sponsors"
        backLabel={t("backToList")}
      >
        <StatusBadge status={inquiry.status} />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex min-w-0 flex-col gap-6">
          <Panel title={t("contact")}>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <a href={`mailto:${inquiry.email}`}>
                  <MailIcon aria-hidden="true" />
                  {tCommon("sendEmail")}
                </a>
              </Button>
              {inquiry.phone ? (
                <Button asChild variant="outline">
                  <a href={telHref(inquiry.phone)}>
                    <PhoneIcon aria-hidden="true" />
                    {tCommon("callNumber", { phone: formatPhone(inquiry.phone) })}
                  </a>
                </Button>
              ) : null}
            </div>
          </Panel>

          <Panel title={t("details")}>
            <DetailList
              rows={[
                { label: t("fields.name"), value: inquiry.fullName },
                { label: t("fields.email"), value: inquiry.email },
                {
                  label: t("fields.phone"),
                  value: inquiry.phone ? formatPhone(inquiry.phone) : null,
                },
                { label: t("fields.organization"), value: inquiry.organization },
                {
                  label: t("fields.wantsTo"),
                  // "OTHER" is also a requester role, whose label does not fit here.
                  value:
                    inquiry.intent === "OTHER"
                      ? t("intentOther")
                      : labels(inquiry.intent),
                },
                { label: t("fields.message"), value: inquiry.message },
                { label: t("fields.language"), value: labels(inquiry.locale) },
                { label: t("fields.consentGiven"), value: format.dateTime(inquiry.consentAt) },
              ]}
            />
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Panel>
            <StatusSelect
              value={inquiry.status}
              options={SPONSOR_STATUSES.map((value) => ({ value, label: labels(value) }))}
              action={updateSponsorStatus.bind(null, inquiry.id)}
            />
          </Panel>
          <Panel>
            <NotesForm
              initial={inquiry.adminNotes ?? ""}
              action={updateSponsorNotes.bind(null, inquiry.id)}
            />
          </Panel>
          <Panel
            title={t("delete.title")}
            description={t("delete.description")}
          >
            <ConfirmAction
              trigger={
                <Button variant="destructive">
                  <Trash2Icon aria-hidden="true" />
                  {t("delete.button")}
                </Button>
              }
              title={t("delete.confirmTitle")}
              description={t("delete.confirmDescription", { name: inquiry.fullName })}
              confirmLabel={tCommon("delete")}
              action={deleteSponsor.bind(null, inquiry.id)}
            />
          </Panel>
        </div>
      </div>
    </>
  );
}
