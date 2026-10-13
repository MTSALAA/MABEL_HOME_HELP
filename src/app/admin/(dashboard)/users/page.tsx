import { PageHeader, Panel } from "@/components/admin/ui";
import { InviteUserForm, UserActiveButton } from "@/components/admin/users-panel";
import { Badge } from "@/components/ui/badge";
import { getAdminFormat, getAdminT } from "@/server/admin-i18n";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/session";

export async function generateMetadata() {
  const t = await getAdminT("Nav");
  return { title: t("users") };
}

// Admin pages wait on the session by design (see the dashboard layout).
export const instant = false;

export default async function UsersPage() {
  const admin = await requireAdmin();
  const [users, t, format] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, email: true, isActive: true, createdAt: true },
    }),
    getAdminT("Users"),
    getAdminFormat(),
  ]);

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("description")}
      />
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Panel title={t("whoHasAccess")}>
          <ul className="divide-y divide-cream-300">
            {users.map((user) => (
              <li
                key={user.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-bold text-forest-900">
                    <span className="truncate">{user.name}</span>
                    {user.isActive ? null : <Badge variant="secondary">{t("deactivated")}</Badge>}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {t("added", { email: user.email, date: format.day(user.createdAt) })}
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
          title={t("inviteTitle")}
          description={t("inviteDescription")}
        >
          <InviteUserForm />
        </Panel>
      </div>
    </>
  );
}
