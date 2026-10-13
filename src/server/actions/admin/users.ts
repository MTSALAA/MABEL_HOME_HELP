"use server";

import { randomBytes, randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { refresh } from "next/cache";
import {
  inviteUserSchema,
  isId,
  toFieldErrors,
  type AdminResult,
} from "@/lib/validation/admin";
import { getAdminT } from "@/server/admin-i18n";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db";
import { reportError } from "@/server/report-error";
import { requireAdmin } from "@/server/session";

/**
 * Creates an admin with a random password nobody knows, then emails them a
 * link to choose their own (the same flow as a password reset).
 */
export async function inviteUser(values: unknown): Promise<AdminResult> {
  await requireAdmin();
  const t = await getAdminT("Users.errors");
  const parsed = inviteUserSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: t("checkFields"),
      fieldErrors: toFieldErrors(parsed.error),
    };
  }
  const email = parsed.data.email.toLowerCase();

  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    return {
      ok: false,
      error: t("checkFields"),
      // A key of "Admin.Validation", like the ones from toFieldErrors().
      fieldErrors: { email: "emailTaken" },
    };
  }

  const userId = randomUUID();
  await prisma.$transaction([
    prisma.user.create({
      data: { id: userId, name: parsed.data.name, email, emailVerified: false },
    }),
    prisma.account.create({
      data: {
        id: randomUUID(),
        accountId: userId,
        providerId: "credential",
        userId,
        password: await hashPassword(randomBytes(32).toString("base64url")),
      },
    }),
  ]);

  // Sent through the password-reset flow. Delivery problems are reported by
  // the email layer, not thrown here; if the email never arrives, "Forgot your
  // password?" on the sign-in page sends a fresh link.
  try {
    await auth.api.requestPasswordReset({
      body: { email, redirectTo: "/admin/reset-password" },
    });
  } catch (error) {
    reportError(error, "admin.inviteUser.email");
  }

  refresh();
  return { ok: true };
}

export async function setUserActive(
  userId: string,
  isActive: boolean,
): Promise<AdminResult> {
  const admin = await requireAdmin();
  // Checked strictly: a non-boolean must not slip past the guards below.
  if (!isId(userId) || typeof isActive !== "boolean") {
    return { ok: false, error: (await getAdminT("Common"))("invalidRequest") };
  }

  const t = await getAdminT("Users.errors");
  if (!isActive) {
    if (userId === admin.id) {
      return { ok: false, error: t("ownAccount") };
    }
    const otherActive = await prisma.user.count({
      where: { isActive: true, NOT: { id: userId } },
    });
    if (otherActive === 0) {
      return { ok: false, error: t("lastAdmin") };
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isActive },
  });
  if (!isActive) {
    // Sign them out everywhere immediately.
    await prisma.session.deleteMany({ where: { userId } });
  }

  refresh();
  return { ok: true };
}
