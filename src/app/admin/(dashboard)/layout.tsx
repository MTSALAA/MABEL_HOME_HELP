import { Suspense } from "react";
import { AdminShell } from "@/components/admin/shell";
import { Skeleton } from "@/components/ui/skeleton";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/session";

async function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const [requests, sponsors, pastDue] = await Promise.all([
    prisma.bookingRequest.count({ where: { status: "NEW" } }),
    prisma.sponsorInquiry.count({ where: { status: "NEW" } }),
    prisma.membership.count({ where: { status: "PAST_DUE" } }),
  ]);

  return (
    <AdminShell
      admin={{ name: admin.name, email: admin.email }}
      badges={{ requests, sponsors, pastDue }}
    >
      {children}
    </AdminShell>
  );
}

function ShellFallback() {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[17rem_1fr]">
      <div className="hidden bg-forest-900 lg:block" />
      <div className="flex flex-col gap-4 p-6 lg:p-10">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

// The session is read at request time, so the whole dashboard streams in
// behind this boundary. Every page below also calls requireAdmin() itself:
// layouts are not re-run on client navigation and must not be the only check.
export default function DashboardLayout({
  children,
}: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<ShellFallback />}>
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </Suspense>
  );
}
