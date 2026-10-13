import { MailIcon, PhoneIcon, Trash2Icon } from "lucide-react";
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
import { formatPhone, telHref } from "@/lib/phone";
import {
  deleteSponsor,
  updateSponsorNotes,
  updateSponsorStatus,
} from "@/server/actions/admin/inbox";
import { prisma } from "@/server/db";
import { SPONSOR_STATUSES } from "@/server/queries/admin";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Sponsor inquiry" };

// Admin pages wait on the session by design (see the dashboard layout).
export const instant = false;

export default async function SponsorDetailPage({
  params,
}: PageProps<"/admin/sponsors/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const inquiry = await prisma.sponsorInquiry.findUnique({ where: { id } });
  if (!inquiry) notFound();

  return (
    <>
      <PageHeader
        title={inquiry.fullName}
        description={`Sponsor inquiry received ${formatDateTime(inquiry.createdAt)}`}
        backHref="/admin/sponsors"
        backLabel="All sponsor inquiries"
      >
        <StatusBadge status={inquiry.status} />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex min-w-0 flex-col gap-6">
          <Panel title="Contact">
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <a href={`mailto:${inquiry.email}`}>
                  <MailIcon aria-hidden="true" />
                  Email
                </a>
              </Button>
              {inquiry.phone ? (
                <Button asChild variant="outline">
                  <a href={telHref(inquiry.phone)}>
                    <PhoneIcon aria-hidden="true" />
                    Call {formatPhone(inquiry.phone)}
                  </a>
                </Button>
              ) : null}
            </div>
          </Panel>

          <Panel title="Details">
            <DetailList
              rows={[
                { label: "Name", value: inquiry.fullName },
                { label: "Email", value: inquiry.email },
                { label: "Phone", value: inquiry.phone ? formatPhone(inquiry.phone) : null },
                { label: "Organization", value: inquiry.organization },
                { label: "Wants to", value: label(inquiry.intent) },
                { label: "Message", value: inquiry.message },
                { label: "Language", value: label(inquiry.locale) },
                { label: "Consent given", value: formatDateTime(inquiry.consentAt) },
              ]}
            />
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Panel>
            <StatusSelect
              value={inquiry.status}
              options={SPONSOR_STATUSES.map((value) => ({ value, label: label(value) }))}
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
            title="Delete this inquiry"
            description="Removes it permanently, for example when someone asks for their information to be deleted."
          >
            <ConfirmAction
              trigger={
                <Button variant="destructive">
                  <Trash2Icon aria-hidden="true" />
                  Delete permanently
                </Button>
              }
              title="Delete this inquiry?"
              description={`This permanently removes ${inquiry.fullName}'s inquiry and cannot be undone.`}
              confirmLabel="Delete"
              action={deleteSponsor.bind(null, inquiry.id)}
            />
          </Panel>
        </div>
      </div>
    </>
  );
}
