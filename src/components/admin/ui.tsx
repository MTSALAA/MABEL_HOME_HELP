import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { ADMIN_PAGE_SIZE } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  backHref,
  backLabel,
  children,
}: {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6">
      {backHref ? (
        <Link
          href={backHref}
          className="mb-3 inline-flex min-h-9 items-center gap-1 rounded-md text-sm font-bold text-forest-700 hover:underline"
        >
          <ChevronLeftIcon className="size-4" aria-hidden="true" />
          {backLabel ?? "Back"}
        </Link>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[1.75rem] leading-tight font-bold text-forest-900">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 max-w-2xl text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
      </div>
    </div>
  );
}

export function Panel({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-xl border border-cream-300 bg-white p-5 shadow-soft",
        className,
      )}
    >
      {title ? (
        <h2 className="font-sans text-base font-bold text-forest-900">{title}</h2>
      ) : null}
      {description ? (
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      ) : null}
      <div className={cn(title && "mt-4")}>{children}</div>
    </section>
  );
}

const STATUS_STYLES: Record<string, string> = {
  NEW: "bg-honey-soft text-forest-950 border-honey",
  CONTACTED: "bg-forest-100 text-forest-900 border-forest-300",
  SCHEDULED: "bg-forest-100 text-forest-900 border-forest-300",
  DONE: "bg-forest-700 text-white border-forest-700",
  CLOSED: "bg-forest-700 text-white border-forest-700",
  ARCHIVED: "bg-cream-100 text-ink-muted border-cream-300",
  ACTIVE: "bg-forest-700 text-white border-forest-700",
  PAST_DUE: "bg-danger-soft text-danger border-danger",
  CANCELED: "bg-cream-100 text-ink-muted border-cream-300",
  PENDING: "bg-cream-100 text-ink-muted border-cream-300",
};

const STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  SCHEDULED: "Scheduled",
  DONE: "Done",
  CLOSED: "Closed",
  ARCHIVED: "Archived",
  ACTIVE: "Active",
  PAST_DUE: "Past due",
  CANCELED: "Ended",
  PENDING: "Unpaid checkout",
  BOOKING: "Service request",
  GENERAL: "Message",
  SELF: "Themselves",
  FAMILY: "A family member",
  OTHER: "Someone else",
  CALL: "Call",
  TEXT: "Text",
  EMAIL: "Email",
  SPONSOR_VISITS: "Sponsor visits",
  NOMINATE_SENIOR: "Nominate a senior",
  EN: "English",
  FR: "French",
};

/** Human label for any enum value shown in the admin. */
export function label(value: string | null | undefined): string {
  if (!value) return "";
  return STATUS_LABELS[value] ?? value;
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("font-bold", STATUS_STYLES[status])}>
      {label(status)}
    </Badge>
  );
}

const dateTimeFormat = new Intl.DateTimeFormat("en-CA", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Edmonton",
});
const dateFormat = new Intl.DateTimeFormat("en-CA", {
  dateStyle: "medium",
  timeZone: "America/Edmonton",
});

export function formatDateTime(date: Date): string {
  return dateTimeFormat.format(date);
}

export function formatDay(date: Date | null | undefined): string {
  return date ? dateFormat.format(date) : "";
}

/** Definition list used on detail pages. Empty values are skipped. */
export function DetailList({
  rows,
}: {
  rows: { label: string; value: ReactNode | null | undefined }[];
}) {
  const shown = rows.filter(
    (row) => row.value !== null && row.value !== undefined && row.value !== "",
  );
  return (
    <dl className="divide-y divide-cream-300">
      {shown.map((row) => (
        <div key={row.label} className="grid gap-1 py-3 sm:grid-cols-[11rem_1fr] sm:gap-4">
          <dt className="text-sm text-muted-foreground">{row.label}</dt>
          <dd className="font-bold break-words whitespace-pre-wrap text-ink">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function Pagination({
  page,
  total,
  basePath,
  searchParams,
}: {
  page: number;
  total: number;
  basePath: string;
  searchParams: Record<string, string>;
}) {
  const pages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  if (total === 0) return null;

  const hrefFor = (target: number) => {
    const params = new URLSearchParams(searchParams);
    if (target > 1) params.set("page", String(target));
    else params.delete("page");
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  const from = (page - 1) * ADMIN_PAGE_SIZE + 1;
  const to = Math.min(total, page * ADMIN_PAGE_SIZE);
  const linkClass =
    "inline-flex h-9 items-center gap-1 rounded-md border border-cream-300 bg-white px-3 text-sm font-bold text-forest-900 hover:bg-forest-100";
  const disabledClass =
    "inline-flex h-9 items-center gap-1 rounded-md border border-cream-300 px-3 text-sm font-bold text-ink-muted/60";

  return (
    <nav
      aria-label="Pagination"
      className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row"
    >
      <p className="text-sm text-muted-foreground">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link href={hrefFor(page - 1)} className={linkClass}>
            <ChevronLeftIcon className="size-4" aria-hidden="true" />
            Previous
          </Link>
        ) : (
          <span className={disabledClass} aria-disabled="true">
            <ChevronLeftIcon className="size-4" aria-hidden="true" />
            Previous
          </span>
        )}
        <span className="px-2 text-sm font-bold">
          Page {page} of {pages}
        </span>
        {page < pages ? (
          <Link href={hrefFor(page + 1)} className={linkClass}>
            Next
            <ChevronRightIcon className="size-4" aria-hidden="true" />
          </Link>
        ) : (
          <span className={disabledClass} aria-disabled="true">
            Next
            <ChevronRightIcon className="size-4" aria-hidden="true" />
          </span>
        )}
      </div>
    </nav>
  );
}

/** Active filters as a plain record, for building pagination and sort links. */
export function activeParams(filters: {
  q: string;
  status: string;
  type: string;
  plan: string;
  sort: string;
}): Record<string, string> {
  const params: Record<string, string> = {};
  for (const key of ["q", "status", "type", "plan", "sort"] as const) {
    if (filters[key]) params[key] = filters[key];
  }
  return params;
}
