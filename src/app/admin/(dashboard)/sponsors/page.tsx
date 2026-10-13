import Link from "next/link";
import { DataTable, type DataColumn } from "@/components/admin/data-table";
import { ListToolbar } from "@/components/admin/list-toolbar";
import {
  activeParams,
  PageHeader,
  Pagination,
  StatusBadge,
} from "@/components/admin/ui";
import { exportSponsorsCsv } from "@/server/actions/admin/inbox";
import { getAdminFormat, getAdminLabels, getAdminT } from "@/server/admin-i18n";
import {
  listSponsors,
  parseListFilters,
  SPONSOR_STATUSES,
} from "@/server/queries/admin";
import { requireAdmin } from "@/server/session";

export async function generateMetadata() {
  const t = await getAdminT("Nav");
  return { title: t("sponsors") };
}

// Admin pages wait on the session by design (see the dashboard layout).
export const instant = false;

export default async function SponsorsPage({
  searchParams,
}: PageProps<"/admin/sponsors">) {
  await requireAdmin();
  const filters = parseListFilters(await searchParams);
  const { rows, total, sort } = await listSponsors(filters);
  const [t, tCommon, labels, format] = await Promise.all([
    getAdminT("Sponsors"),
    getAdminT("Common"),
    getAdminLabels(),
    getAdminFormat(),
  ]);
  // "OTHER" is also a requester role, whose label does not fit here.
  const intentLabel = (intent: string) =>
    intent === "OTHER" ? t("intentOther") : labels(intent);

  const columns: DataColumn[] = [
    // On a phone only Name and Status are shown; the name cell then carries
    // the date and what they want to do.
    { id: "received", header: t("fields.received"), sortKey: "createdAt", className: "hidden sm:table-cell" },
    { id: "name", header: t("fields.name"), sortKey: "fullName", className: "whitespace-normal" },
    { id: "email", header: t("fields.email"), className: "hidden md:table-cell" },
    { id: "organization", header: t("fields.organization"), className: "hidden lg:table-cell" },
    { id: "intent", header: t("fields.wantsTo"), className: "hidden sm:table-cell" },
    { id: "status", header: tCommon("status"), sortKey: "status" },
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
            options: SPONSOR_STATUSES.map((value) => ({ value, label: labels(value) })),
          },
        ]}
        exportAction={exportSponsorsCsv.bind(null, filters)}
      />
      <DataTable
        columns={columns}
        sort={sort}
        emptyMessage={t("empty")}
        rows={rows.map((row) => ({
          id: row.id,
          href: `/admin/sponsors/${row.id}`,
          cells: {
            received: (
              <span className="whitespace-nowrap">{format.dateTime(row.createdAt)}</span>
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
                  {intentLabel(row.intent)} · {format.day(row.createdAt)}
                </span>
              </>
            ),
            email: row.email,
            organization: row.organization ?? "—",
            intent: intentLabel(row.intent),
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
