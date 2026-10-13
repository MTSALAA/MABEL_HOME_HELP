import type {
  MembershipStatus,
  Prisma,
  RequestStatus,
  RequestType,
  SponsorStatus,
} from "@prisma/client";
import { ADMIN_PAGE_SIZE } from "@/lib/constants";
import { prisma } from "@/server/db";
import { reconcilePendingMemberships } from "@/server/memberships";
import { reportError } from "@/server/report-error";

export const REQUEST_STATUSES: RequestStatus[] = [
  "NEW",
  "CONTACTED",
  "SCHEDULED",
  "DONE",
  "ARCHIVED",
];
export const REQUEST_TYPES: RequestType[] = ["BOOKING", "GENERAL"];
export const SPONSOR_STATUSES: SponsorStatus[] = [
  "NEW",
  "CONTACTED",
  "CLOSED",
  "ARCHIVED",
];
export const MEMBERSHIP_STATUSES: MembershipStatus[] = [
  "ACTIVE",
  "PAST_DUE",
  "CANCELED",
  "PENDING",
];

export type ListFilters = {
  q: string;
  status: string;
  type: string;
  plan: string;
  sort: string;
  page: number;
};

type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export function parseListFilters(searchParams: RawSearchParams): ListFilters {
  const page = Number.parseInt(first(searchParams.page), 10);
  return {
    q: first(searchParams.q).slice(0, 100),
    status: first(searchParams.status),
    type: first(searchParams.type),
    plan: first(searchParams.plan),
    sort: first(searchParams.sort),
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

/** "createdAt.desc" -> a Prisma orderBy, limited to an allow-list of columns. */
function parseSort<T extends string>(
  sort: string,
  allowed: readonly T[],
  fallback: T,
): { field: T; direction: "asc" | "desc" } {
  const [field, direction] = sort.split(".");
  return {
    field: (allowed as readonly string[]).includes(field) ? (field as T) : fallback,
    direction: direction === "asc" ? "asc" : "desc",
  };
}

function phoneDigits(q: string): string {
  return q.replace(/\D/g, "");
}

// --- Booking requests ---------------------------------------------------------

export function requestWhere(filters: ListFilters): Prisma.BookingRequestWhereInput {
  const where: Prisma.BookingRequestWhereInput = {};
  if ((REQUEST_STATUSES as string[]).includes(filters.status)) {
    where.status = filters.status as RequestStatus;
  } else {
    // Archived requests stay out of the default view.
    where.status = { not: "ARCHIVED" };
  }
  if ((REQUEST_TYPES as string[]).includes(filters.type)) {
    where.type = filters.type as RequestType;
  }
  if (filters.q) {
    const digits = phoneDigits(filters.q);
    where.OR = [
      { fullName: { contains: filters.q, mode: "insensitive" } },
      { email: { contains: filters.q, mode: "insensitive" } },
      ...(digits.length >= 3 ? [{ phone: { contains: digits } }] : []),
    ];
  }
  return where;
}

export async function listRequests(filters: ListFilters) {
  const where = requestWhere(filters);
  const sort = parseSort(filters.sort, ["createdAt", "fullName", "status"], "createdAt");
  const [rows, total] = await Promise.all([
    prisma.bookingRequest.findMany({
      where,
      include: { service: { select: { titleEn: true, titleFr: true } } },
      orderBy: { [sort.field]: sort.direction },
      skip: (filters.page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    prisma.bookingRequest.count({ where }),
  ]);
  return { rows, total, sort };
}

// --- Sponsor inquiries --------------------------------------------------------

export function sponsorWhere(filters: ListFilters): Prisma.SponsorInquiryWhereInput {
  const where: Prisma.SponsorInquiryWhereInput = {};
  if ((SPONSOR_STATUSES as string[]).includes(filters.status)) {
    where.status = filters.status as SponsorStatus;
  } else {
    where.status = { not: "ARCHIVED" };
  }
  if (filters.q) {
    const digits = phoneDigits(filters.q);
    where.OR = [
      { fullName: { contains: filters.q, mode: "insensitive" } },
      { email: { contains: filters.q, mode: "insensitive" } },
      { organization: { contains: filters.q, mode: "insensitive" } },
      ...(digits.length >= 3 ? [{ phone: { contains: digits } }] : []),
    ];
  }
  return where;
}

export async function listSponsors(filters: ListFilters) {
  const where = sponsorWhere(filters);
  const sort = parseSort(filters.sort, ["createdAt", "fullName", "status"], "createdAt");
  const [rows, total] = await Promise.all([
    prisma.sponsorInquiry.findMany({
      where,
      orderBy: { [sort.field]: sort.direction },
      skip: (filters.page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    prisma.sponsorInquiry.count({ where }),
  ]);
  return { rows, total, sort };
}

// --- Memberships --------------------------------------------------------------

export function membershipWhere(filters: ListFilters): Prisma.MembershipWhereInput {
  const where: Prisma.MembershipWhereInput = {};
  if ((MEMBERSHIP_STATUSES as string[]).includes(filters.status)) {
    where.status = filters.status as MembershipStatus;
  } else {
    // Unpaid checkouts are noise unless asked for.
    where.status = { not: "PENDING" };
  }
  if (filters.plan) where.planId = filters.plan;
  if (filters.q) {
    const digits = phoneDigits(filters.q);
    where.OR = [
      { payerName: { contains: filters.q, mode: "insensitive" } },
      { recipientName: { contains: filters.q, mode: "insensitive" } },
      { payerEmail: { contains: filters.q, mode: "insensitive" } },
      ...(digits.length >= 3
        ? [
            { payerPhone: { contains: digits } },
            { recipientPhone: { contains: digits } },
          ]
        : []),
    ];
  }
  return where;
}

export async function listMemberships(filters: ListFilters) {
  // Unpaid sign-ups are checked against Stripe first, so a payment whose
  // webhook was missed shows up here as a member rather than disappearing.
  await reconcilePendingMemberships().catch((error) =>
    reportError(error, "admin.listMemberships.reconcile"),
  );

  const where = membershipWhere(filters);
  const sort = parseSort(
    filters.sort,
    ["createdAt", "payerName", "status", "currentPeriodEnd"],
    "createdAt",
  );
  const [rows, total] = await Promise.all([
    prisma.membership.findMany({
      where,
      include: { plan: { select: { nameEn: true, nameFr: true } } },
      orderBy: { [sort.field]: sort.direction },
      skip: (filters.page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    prisma.membership.count({ where }),
  ]);
  return { rows, total, sort };
}

// --- Overview -----------------------------------------------------------------

export async function getOverview() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [
    newRequests,
    requestsThisWeek,
    activeMembers,
    pastDueMembers,
    newSponsors,
    recentRequests,
    recentMemberships,
    settings,
    plansMissingPrice,
  ] = await Promise.all([
    prisma.bookingRequest.count({ where: { status: "NEW" } }),
    prisma.bookingRequest.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.membership.count({ where: { status: "ACTIVE" } }),
    prisma.membership.count({ where: { status: "PAST_DUE" } }),
    prisma.sponsorInquiry.count({ where: { status: "NEW" } }),
    prisma.bookingRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { service: { select: { titleEn: true, titleFr: true } } },
    }),
    prisma.membership.findMany({
      where: { status: { not: "PENDING" } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { plan: { select: { nameEn: true, nameFr: true } } },
    }),
    prisma.siteSettings.findUnique({ where: { id: 1 } }),
    prisma.plan.findMany({
      where: { isActive: true, isPurchasable: true, stripePriceId: null },
      select: { id: true, nameEn: true, nameFr: true },
    }),
  ]);

  return {
    newRequests,
    requestsThisWeek,
    activeMembers,
    pastDueMembers,
    newSponsors,
    recentRequests,
    recentMemberships,
    missingPhone: !settings?.phone,
    missingEmail: !settings?.email,
    plansMissingPrice,
  };
}
