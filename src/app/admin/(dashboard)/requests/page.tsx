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
import { REQUEST_RETENTION_MONTHS } from "@/lib/constants";
import { formatPhone } from "@/lib/phone";
import { exportRequestsCsv } from "@/server/actions/admin/inbox";
import {
  listRequests,
  parseListFilters,
  REQUEST_STATUSES,
  REQUEST_TYPES,
} from "@/server/queries/admin";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Requests" };

// Admin pages wait on the session by design (see the dashboard layout).
export const instant = false;

const COLUMNS: DataColumn[] = [
  // On a phone only Name and Status are shown; the name cell then carries
  // the phone number and date.
  { id: "received", header: "Received", sortKey: "createdAt", className: "hidden sm:table-cell" },
  { id: "name", header: "Name", sortKey: "fullName", className: "whitespace-normal" },
  { id: "phone", header: "Phone", className: "hidden sm:table-cell" },
  { id: "service", header: "Service", className: "hidden md:table-cell" },
  { id: "area", header: "Area", className: "hidden lg:table-cell" },
  { id: "type", header: "Type", className: "hidden xl:table-cell" },
  { id: "status", header: "Status", sortKey: "status" },
];

export default async function RequestsPage({
  searchParams,
}: PageProps<"/admin/requests">) {
  await requireAdmin();
  const filters = parseListFilters(await searchParams);
  const { rows, total, sort } = await listRequests(filters);

  return (
    <>
      <PageHeader
        title="Requests"
        description={`Service requests and messages sent through the website. They are kept for ${REQUEST_RETENTION_MONTHS} months, then deleted automatically.`}
      />
      <ListToolbar
        searchPlaceholder="Search by name, phone or email"
        filters={[
          {
            param: "status",
            label: "Status",
            allLabel: "All except archived",
            options: REQUEST_STATUSES.map((value) => ({ value, label: label(value) })),
          },
          {
            param: "type",
            label: "Type",
            allLabel: "All types",
            options: REQUEST_TYPES.map((value) => ({ value, label: label(value) })),
          },
        ]}
        exportAction={exportRequestsCsv.bind(null, filters)}
      />
      <DataTable
        columns={COLUMNS}
        sort={sort}
        emptyMessage="No requests match these filters."
        rows={rows.map((row) => ({
          id: row.id,
          href: `/admin/requests/${row.id}`,
          cells: {
            received: (
              <span className="whitespace-nowrap">{formatDateTime(row.createdAt)}</span>
            ),
            name: (
              <>
                <Link
                  href={`/admin/requests/${row.id}`}
                  className="font-bold text-forest-900 hover:underline"
                >
                  {row.fullName}
                </Link>
                <span className="block text-sm text-muted-foreground sm:hidden">
                  {formatPhone(row.phone)} · {formatDay(row.createdAt)}
                </span>
              </>
            ),
            phone: <span className="whitespace-nowrap">{formatPhone(row.phone)}</span>,
            service: row.service?.titleEn ?? "—",
            area: row.area === "OTHER" ? "Other" : (row.area ?? "—"),
            type: label(row.type),
            status: <StatusBadge status={row.status} />,
          },
        }))}
      />
      <Pagination
        page={filters.page}
        total={total}
        basePath="/admin/requests"
        searchParams={activeParams(filters)}
      />
    </>
  );
}
