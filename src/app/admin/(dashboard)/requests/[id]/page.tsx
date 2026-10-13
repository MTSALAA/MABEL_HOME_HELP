import { MailIcon, MessageSquareTextIcon, PhoneIcon, Trash2Icon } from "lucide-react";
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
import { pick } from "@/lib/localize";
import { formatPhone, smsHref, telHref } from "@/lib/phone";
import {
  deleteRequest,
  updateRequestNotes,
  updateRequestStatus,
} from "@/server/actions/admin/inbox";
import {
  getAdminFormat,
  getAdminLabels,
  getAdminLocale,
  getAdminT,
} from "@/server/admin-i18n";
import { prisma } from "@/server/db";
import { REQUEST_STATUSES } from "@/server/queries/admin";
import { requireAdmin } from "@/server/session";

export async function generateMetadata() {
  const t = await getAdminT("Requests");
  return { title: t("detailTitle") };
}

// Admin pages wait on the session by design (see the dashboard layout).
export const instant = false;

export default async function RequestDetailPage({
  params,
}: PageProps<"/admin/requests/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const request = await prisma.bookingRequest.findUnique({
    where: { id },
    include: {
      service: { select: { titleEn: true, titleFr: true } },
      plan: { select: { nameEn: true, nameFr: true } },
    },
  });
  if (!request) notFound();

  const [locale, t, tCommon, labels, format] = await Promise.all([
    getAdminLocale(),
    getAdminT("Requests"),
    getAdminT("Common"),
    getAdminLabels(),
    getAdminFormat(),
  ]);

  return (
    <>
      <PageHeader
        title={request.fullName}
        description={t("received", {
          type: request.type,
          date: format.dateTime(request.createdAt),
        })}
        backHref="/admin/requests"
        backLabel={t("backToList")}
      >
        <StatusBadge status={request.status} />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex min-w-0 flex-col gap-6">
          <Panel title={t("contact")}>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <a href={telHref(request.phone)}>
                  <PhoneIcon aria-hidden="true" />
                  {tCommon("callNumber", { phone: formatPhone(request.phone) })}
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={smsHref(request.phone)}>
                  <MessageSquareTextIcon aria-hidden="true" />
                  {tCommon("sendText")}
                </a>
              </Button>
              {request.email ? (
                <Button asChild variant="outline">
                  <a href={`mailto:${request.email}`}>
                    <MailIcon aria-hidden="true" />
                    {tCommon("sendEmail")}
                  </a>
                </Button>
              ) : null}
            </div>
          </Panel>

          <Panel title={t("details")}>
            <DetailList
              rows={[
                { label: t("fields.name"), value: request.fullName },
                { label: t("fields.phone"), value: formatPhone(request.phone) },
                { label: t("fields.email"), value: request.email },
                { label: t("fields.requestingFor"), value: labels(request.requesterRole) },
                {
                  label: t("fields.service"),
                  value: request.service
                    ? pick(locale, request.service.titleEn, request.service.titleFr)
                    : null,
                },
                {
                  label: t("fields.planOfInterest"),
                  value: request.plan
                    ? pick(locale, request.plan.nameEn, request.plan.nameFr)
                    : null,
                },
                {
                  label: t("fields.area"),
                  value: request.area === "OTHER" ? t("areaOtherDetail") : request.area,
                },
                { label: t("fields.prefersContactBy"), value: labels(request.contactMethod) },
                { label: t("fields.preferredTime"), value: request.preferredTime },
                { label: t("fields.message"), value: request.message },
                { label: t("fields.language"), value: labels(request.locale) },
                { label: t("fields.consentGiven"), value: format.dateTime(request.consentAt) },
              ]}
            />
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Panel>
            <StatusSelect
              value={request.status}
              options={REQUEST_STATUSES.map((value) => ({ value, label: labels(value) }))}
              action={updateRequestStatus.bind(null, request.id)}
            />
          </Panel>
          <Panel>
            <NotesForm
              initial={request.adminNotes ?? ""}
              action={updateRequestNotes.bind(null, request.id)}
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
              description={t("delete.confirmDescription", { name: request.fullName })}
              confirmLabel={tCommon("delete")}
              action={deleteRequest.bind(null, request.id)}
            />
          </Panel>
        </div>
      </div>
    </>
  );
}
