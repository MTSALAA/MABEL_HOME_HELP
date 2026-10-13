import type { Metadata } from "next";
import Link from "next/link";
import { DataTable, type DataColumn } from "@/components/admin/data-table";
import { ListToolbar } from "@/components/admin/list-toolbar";
import {
  activeParams,
  formatDay,
  label,
  PageHeader,
  Pagination,
  StatusBadge,
} from "@/components/admin/ui";
import { exportMembersCsv } from "@/server/actions/admin/inbox";
import { prisma } from "@/server/db";
import {
  listMemberships,
  MEMBERSHIP_STATUSES,
  parseListFilters,
} from "@/server/queries/admin";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Members" };

// Admin pages wait on the session by design (see the dashboard layout).
export const instant = false;

const COLUMNS: DataColumn[] = [
  // On a phone only Member and Status are shown; the member cell then
  // carries the plan.
  { id: "member", header: "Member", sortKey: "payerName", className: "whitespace-normal" },
  { id: "recipient", header: "Visits for", className: "hidden md:table-cell" },
  { id: "plan", header: "Plan", className: "hidden sm:table-cell" },
  { id: "status", header: "Status", sortKey: "status" },
  { id: "started", header: "Started", sortKey: "createdAt", className: "hidden lg:table-cell" },
  { id: "next", header: "Next billing", sortKey: "currentPeriodEnd", className: "hidden sm:table-cell" },
  { id: "area", header: "Area", className: "hidden xl:table-cell" },
];

export default async function MembersPage({
  searchParams,
}: PageProps<"/admin/members">) {
  await requireAdmin();
  const filters = parseListFilters(await searchParams);
  const [{ rows, total, sort }, plans] = await Promise.all([
    listMemberships(filters),
    prisma.plan.findMany({
      where: { memberships: { some: {} } },
      select: { id: true, nameEn: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Members"
        description="Monthly memberships bought online. Billing is handled by Stripe."
      />
      <ListToolbar
        searchPlaceholder="Search by name, phone or email"
        filters={[
          {
            param: "status",
            label: "Status",
            allLabel: "All paid memberships",
            options: MEMBERSHIP_STATUSES.map((value) => ({ value, label: label(value) })),
          },
          {
            param: "plan",
            label: "Plan",
            allLabel: "All plans",
            options: plans.map((plan) => ({ value: plan.id, label: plan.nameEn })),
          },
        ]}
        exportAction={exportMembersCsv.bind(null, filters)}
      />
      <DataTable
        columns={COLUMNS}
        sort={sort}
        emptyMessage="No memberships match these filters."
        rows={rows.map((row) => ({
          id: row.id,
          href: `/admin/members/${row.id}`,
          cells: {
            member: (
              <>
                <Link
                  href={`/admin/members/${row.id}`}
                  className="font-bold text-forest-900 hover:underline"
                >
                  {row.payerName}
                </Link>
                <span className="block text-sm text-muted-foreground sm:hidden">
                  {row.plan.nameEn}
                </span>
              </>
            ),
            recipient:
              row.requesterRole === "SELF" ? "Themselves" : (row.recipientName ?? "—"),
            plan: row.plan.nameEn,
            status: (
              <span className="flex flex-col items-start gap-1">
                <StatusBadge status={row.status} />
                {row.cancelAtPeriodEnd && row.status !== "CANCELED" ? (
                  <span className="text-xs font-bold text-ink-muted">Ends at period end</span>
                ) : null}
              </span>
            ),
            started: <span className="whitespace-nowrap">{formatDay(row.createdAt)}</span>,
            next:
              row.status === "CANCELED" || row.cancelAtPeriodEnd ? (
                "—"
              ) : (
                <span className="whitespace-nowrap">
                  {formatDay(row.currentPeriodEnd) || "—"}
                </span>
              ),
            area: row.area,
          },
        }))}
      />
      <Pagination
        page={filters.page}
        total={total}
        basePath="/admin/members"
        searchParams={activeParams(filters)}
      />
    </>
  );
}
