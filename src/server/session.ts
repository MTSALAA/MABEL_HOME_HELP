import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
};

/** The signed-in, active admin, or null. Always checks the database. */
export async function getAdmin(): Promise<AdminUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.isActive === false) return null;
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
  };
}

/**
 * Call at the top of every admin page AND every admin Server Action. The
 * proxy only checks that a cookie exists; this is the real authorisation.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
