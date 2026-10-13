import Link from "next/link";
import { DataTable, type DataColumn } from "@/components/admin/data-table";
import { ListToolbar } from "@/components/admin/list-toolbar";
import {
  activeParams,
  PageHeader,
  Pagination,
  StatusBadge,
} from "@/components/admin/ui";
import { REQUEST_RETENTION_MONTHS } from "@/lib/constants";
import { pick } from "@/lib/localize";
import { formatPhone } from "@/lib/phone";
import { exportRequestsCsv } from "@/server/actions/admin/inbox";
import {
  getAdminFormat,
  getAdminLabels,
  getAdminLocale,
  getAdminT,
} from "@/server/admin-i18n";
import {
  listRequests,
  parseListFilters,
  REQUEST_STATUSES,
  REQUEST_TYPES,
} from "@/server/queries/admin";
import { requireAdmin } from "@/server/session";

export async function generateMetadata() {
  const t = await getAdminT("Nav");
  return { title: t("requests") };
}

// Admin pages wait on the session by design (see the dashboard layout).
export const instant = false;

export default async function RequestsPage({
  searchParams,
}: PageProps<"/admin/requests">) {
  await requireAdmin();
  const filters = parseListFilters(await searchParams);
  const { rows, total, sort } = await listRequests(filters);
  const [locale, t, tCommon, labels, format] = await Promise.all([
    getAdminLocale(),
    getAdminT("Requests"),
    getAdminT("Common"),
    getAdminLabels(),
    getAdminFormat(),
  ]);

  const columns: DataColumn[] = [
    // On a phone only Name and Status are shown; the name cell then carries
    // the phone number and date.
    { id: "received", header: t("fields.received"), sortKey: "createdAt", className: "hidden sm:table-cell" },
    { id: "name", header: t("fields.name"), sortKey: "fullName", className: "whitespace-normal" },
    { id: "phone", header: t("fields.phone"), className: "hidden sm:table-cell" },
    { id: "service", header: t("fields.service"), className: "hidden md:table-cell" },
    { id: "area", header: t("fields.area"), className: "hidden lg:table-cell" },
    { id: "type", header: t("fields.type"), className: "hidden xl:table-cell" },
    { id: "status", header: tCommon("status"), sortKey: "status" },
  ];

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("description", { months: REQUEST_RETENTION_MONTHS })}
      />
      <ListToolbar
        searchPlaceholder={t("searchPlaceholder")}
        filters={[
          {
            param: "status",
            label: tCommon("status"),
            allLabel: t("allStatuses"),
            options: REQUEST_STATUSES.map((value) => ({ value, label: labels(value) })),
          },
          {
            param: "type",
            label: t("fields.type"),
            allLabel: t("allTypes"),
            options: REQUEST_TYPES.map((value) => ({ value, label: labels(value) })),
          },
        ]}
        exportAction={exportRequestsCsv.bind(null, filters)}
      />
      <DataTable
        columns={columns}
        sort={sort}
        emptyMessage={t("empty")}
        rows={rows.map((row) => ({
          id: row.id,
          href: `/admin/requests/${row.id}`,
          cells: {
            received: (
              <span className="whitespace-nowrap">{format.dateTime(row.createdAt)}</span>
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
                  {formatPhone(row.phone)} · {format.day(row.createdAt)}
                </span>
              </>
            ),
            phone: <span className="whitespace-nowrap">{formatPhone(row.phone)}</span>,
            service: row.service
              ? pick(locale, row.service.titleEn, row.service.titleFr)
              : "—",
            area: row.area === "OTHER" ? t("areaOther") : (row.area ?? "—"),
            type: labels(row.type),
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
