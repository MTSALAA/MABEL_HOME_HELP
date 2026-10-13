import type { Metadata } from "next";
import { formatDay, PageHeader, Panel } from "@/components/admin/ui";
import { InviteUserForm, UserActiveButton } from "@/components/admin/users-panel";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Admin users" };

// Admin pages wait on the session by design (see the dashboard layout).
export const instant = false;

export default async function UsersPage() {
  const admin = await requireAdmin();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, isActive: true, createdAt: true },
  });

  return (
    <>
      <PageHeader
        title="Admin users"
        description="People who can sign in to this dashboard. Everyone here has full access."
      />
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Panel title="Who has access">
          <ul className="divide-y divide-cream-300">
            {users.map((user) => (
              <li
                key={user.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-bold text-forest-900">
                    <span className="truncate">{user.name}</span>
                    {user.isActive ? null : <Badge variant="secondary">Deactivated</Badge>}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {user.email} · added {formatDay(user.createdAt)}
                  </p>
                </div>
                <UserActiveButton
                  userId={user.id}
                  name={user.name}
                  isActive={user.isActive}
                  isSelf={user.id === admin.id}
                />
              </li>
            ))}
          </ul>
        </Panel>
        <Panel
          title="Invite someone"
          description="They get an email with a link to choose their own password."
        >
          <InviteUserForm />
        </Panel>
      </div>
    </>
  );
}
