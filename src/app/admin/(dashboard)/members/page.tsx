import Link from "next/link";
import { DataTable, type DataColumn } from "@/components/admin/data-table";
import { ListToolbar } from "@/components/admin/list-toolbar";
import {
  activeParams,
  PageHeader,
  Pagination,
  StatusBadge,
} from "@/components/admin/ui";
import { pick } from "@/lib/localize";
import { exportMembersCsv } from "@/server/actions/admin/inbox";
import {
  getAdminFormat,
  getAdminLabels,
  getAdminLocale,
  getAdminT,
} from "@/server/admin-i18n";
import { prisma } from "@/server/db";
import {
  listMemberships,
  MEMBERSHIP_STATUSES,
  parseListFilters,
} from "@/server/queries/admin";
import { requireAdmin } from "@/server/session";

export async function generateMetadata() {
  const t = await getAdminT("Nav");
  return { title: t("members") };
}

// Admin pages wait on the session by design (see the dashboard layout).
export const instant = false;

export default async function MembersPage({
  searchParams,
}: PageProps<"/admin/members">) {
  await requireAdmin();
  const filters = parseListFilters(await searchParams);
  const [{ rows, total, sort }, plans] = await Promise.all([
    listMemberships(filters),
    prisma.plan.findMany({
      where: { memberships: { some: {} } },
      select: { id: true, nameEn: true, nameFr: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);
  const [locale, t, tCommon, labels, format] = await Promise.all([
    getAdminLocale(),
    getAdminT("Members"),
    getAdminT("Common"),
    getAdminLabels(),
    getAdminFormat(),
  ]);

  const columns: DataColumn[] = [
    // On a phone only Member and Status are shown; the member cell then
    // carries the plan.
    { id: "member", header: t("fields.member"), sortKey: "payerName", className: "whitespace-normal" },
    { id: "recipient", header: t("fields.visitsFor"), className: "hidden md:table-cell" },
    { id: "plan", header: t("fields.plan"), className: "hidden sm:table-cell" },
    { id: "status", header: tCommon("status"), sortKey: "status" },
    { id: "started", header: t("fields.started"), sortKey: "createdAt", className: "hidden lg:table-cell" },
    { id: "next", header: t("fields.nextBilling"), sortKey: "currentPeriodEnd", className: "hidden sm:table-cell" },
    { id: "area", header: t("fields.area"), className: "hidden xl:table-cell" },
  ];

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <ListToolbar
        searchPlaceholder={t("searchPlaceholder")}
        filters={[
          {
            param: "status",
            label: tCommon("status"),
            allLabel: t("allStatuses"),
            options: MEMBERSHIP_STATUSES.map((value) => ({ value, label: labels(value) })),
          },
          {
            param: "plan",
            label: t("fields.plan"),
            allLabel: t("allPlans"),
            options: plans.map((plan) => ({
              value: plan.id,
              label: pick(locale, plan.nameEn, plan.nameFr),
            })),
          },
        ]}
        exportAction={exportMembersCsv.bind(null, filters)}
      />
      <DataTable
        columns={columns}
        sort={sort}
        emptyMessage={t("empty")}
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
                  {pick(locale, row.plan.nameEn, row.plan.nameFr)}
                </span>
              </>
            ),
            recipient:
              row.requesterRole === "SELF" ? labels("SELF") : (row.recipientName ?? "—"),
            plan: pick(locale, row.plan.nameEn, row.plan.nameFr),
            status: (
              <span className="flex flex-col items-start gap-1">
                <StatusBadge status={row.status} />
                {row.cancelAtPeriodEnd && row.status !== "CANCELED" ? (
                  <span className="text-xs font-bold text-ink-muted">
                    {t("endsAtPeriodEnd")}
                  </span>
                ) : null}
              </span>
            ),
            started: <span className="whitespace-nowrap">{format.day(row.createdAt)}</span>,
            next:
              row.status === "CANCELED" || row.cancelAtPeriodEnd ? (
                "—"
              ) : (
                <span className="whitespace-nowrap">
                  {format.day(row.currentPeriodEnd) || "—"}
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
