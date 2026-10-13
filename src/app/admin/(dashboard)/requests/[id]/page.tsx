import { MailIcon, MessageSquareTextIcon, PhoneIcon, Trash2Icon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ConfirmAction,
  NotesForm,
  StatusSelect,
} from "@/components/admin/detail-controls";
import {
  DetailList,
  formatDateTime,
  label,
  PageHeader,
  Panel,
  StatusBadge,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { formatPhone, smsHref, telHref } from "@/lib/phone";
import {
  deleteRequest,
  updateRequestNotes,
  updateRequestStatus,
} from "@/server/actions/admin/inbox";
import { prisma } from "@/server/db";
import { REQUEST_STATUSES } from "@/server/queries/admin";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Request" };

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
      service: { select: { titleEn: true } },
      plan: { select: { nameEn: true } },
    },
  });
  if (!request) notFound();

  return (
    <>
      <PageHeader
        title={request.fullName}
        description={`${label(request.type)} received ${formatDateTime(request.createdAt)}`}
        backHref="/admin/requests"
        backLabel="All requests"
      >
        <StatusBadge status={request.status} />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex min-w-0 flex-col gap-6">
          <Panel title="Contact">
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <a href={telHref(request.phone)}>
                  <PhoneIcon aria-hidden="true" />
                  Call {formatPhone(request.phone)}
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={smsHref(request.phone)}>
                  <MessageSquareTextIcon aria-hidden="true" />
                  Text
                </a>
              </Button>
              {request.email ? (
                <Button asChild variant="outline">
                  <a href={`mailto:${request.email}`}>
                    <MailIcon aria-hidden="true" />
                    Email
                  </a>
                </Button>
              ) : null}
            </div>
          </Panel>

          <Panel title="Details">
            <DetailList
              rows={[
                { label: "Name", value: request.fullName },
                { label: "Phone", value: formatPhone(request.phone) },
                { label: "Email", value: request.email },
                { label: "Requesting for", value: label(request.requesterRole) },
                { label: "Service", value: request.service?.titleEn },
                { label: "Plan of interest", value: request.plan?.nameEn },
                {
                  label: "Area",
                  value: request.area === "OTHER" ? "Other (outside listed areas)" : request.area,
                },
                { label: "Prefers contact by", value: label(request.contactMethod) },
                { label: "Preferred time", value: request.preferredTime },
                { label: "Message", value: request.message },
                { label: "Language", value: label(request.locale) },
                { label: "Consent given", value: formatDateTime(request.consentAt) },
              ]}
            />
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Panel>
            <StatusSelect
              value={request.status}
              options={REQUEST_STATUSES.map((value) => ({ value, label: label(value) }))}
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
            title="Delete this request"
            description="Removes it permanently, for example when someone asks for their information to be deleted."
          >
            <ConfirmAction
              trigger={
                <Button variant="destructive">
                  <Trash2Icon aria-hidden="true" />
                  Delete permanently
                </Button>
              }
              title="Delete this request?"
              description={`This permanently removes ${request.fullName}'s request and cannot be undone.`}
              confirmLabel="Delete"
              action={deleteRequest.bind(null, request.id)}
            />
          </Panel>
        </div>
      </div>
    </>
  );
}
