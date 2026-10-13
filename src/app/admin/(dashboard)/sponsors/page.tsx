import type { Metadata } from "next";
import Link from "next/link";
import { DataTable, type DataColumn } from "@/components/admin/data-table";
import { ListToolbar } from "@/components/admin/list-toolbar";
import {
  activeParams,
  formatDateTime,
  formatDay,
  label,
  PageHeader,
  Pagination,
  StatusBadge,
} from "@/components/admin/ui";
import { exportSponsorsCsv } from "@/server/actions/admin/inbox";
import {
  listSponsors,
  parseListFilters,
  SPONSOR_STATUSES,
} from "@/server/queries/admin";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Sponsor inquiries" };

// Admin pages wait on the session by design (see the dashboard layout).
export const instant = false;

const COLUMNS: DataColumn[] = [
  // On a phone only Name and Status are shown; the name cell then carries
  // the date and what they want to do.
  { id: "received", header: "Received", sortKey: "createdAt", className: "hidden sm:table-cell" },
  { id: "name", header: "Name", sortKey: "fullName", className: "whitespace-normal" },
  { id: "email", header: "Email", className: "hidden md:table-cell" },
  { id: "organization", header: "Organization", className: "hidden lg:table-cell" },
  { id: "intent", header: "Wants to", className: "hidden sm:table-cell" },
  { id: "status", header: "Status", sortKey: "status" },
];

export default async function SponsorsPage({
  searchParams,
}: PageProps<"/admin/sponsors">) {
  await requireAdmin();
  const filters = parseListFilters(await searchParams);
  const { rows, total, sort } = await listSponsors(filters);

  return (
    <>
      <PageHeader
        title="Sponsor inquiries"
        description="People and organizations interested in Sponsor a Senior."
      />
      <ListToolbar
        searchPlaceholder="Search by name, email, phone or organization"
        filters={[
          {
            param: "status",
            label: "Status",
            allLabel: "All except archived",
            options: SPONSOR_STATUSES.map((value) => ({ value, label: label(value) })),
          },
        ]}
        exportAction={exportSponsorsCsv.bind(null, filters)}
      />
      <DataTable
        columns={COLUMNS}
        sort={sort}
        emptyMessage="No sponsor inquiries match these filters."
        rows={rows.map((row) => ({
          id: row.id,
          href: `/admin/sponsors/${row.id}`,
          cells: {
            received: (
              <span className="whitespace-nowrap">{formatDateTime(row.createdAt)}</span>
            ),
            name: (
              <>
                <Link
                  href={`/admin/sponsors/${row.id}`}
                  className="font-bold text-forest-900 hover:underline"
                >
                  {row.fullName}
                </Link>
                <span className="block text-sm text-muted-foreground sm:hidden">
                  {label(row.intent)} · {formatDay(row.createdAt)}
                </span>
              </>
            ),
            email: row.email,
            organization: row.organization ?? "—",
            intent: label(row.intent),
            status: <StatusBadge status={row.status} />,
          },
        }))}
      />
      <Pagination
        page={filters.page}
        total={total}
        basePath="/admin/sponsors"
        searchParams={activeParams(filters)}
      />
    </>
  );
}
