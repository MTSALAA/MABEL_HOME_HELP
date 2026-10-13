"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  toFieldErrors,
  type AdminResult,
} from "@/lib/validation/admin";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db";
import { RATE_LIMITS, rateLimit } from "@/server/rate-limit";
import { reportError } from "@/server/report-error";
import { getClientIp } from "@/server/request-meta";

const TOO_MANY = "Too many attempts. Please wait 15 minutes and try again.";
// One message for every failure, so the form never reveals which emails exist.
const BAD_CREDENTIALS = "Incorrect email or password.";

export async function signInAction(values: unknown): Promise<AdminResult> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: BAD_CREDENTIALS, fieldErrors: toFieldErrors(parsed.error) };
  }
  const email = parsed.data.email.toLowerCase();

  const ip = await getClientIp();
  // The tight limit is on the email+address pair, so someone hammering the
  // owner's email from elsewhere cannot lock the owner out of their own site.
  const allowed = await Promise.all([
    rateLimit(`login:pair:${email}:${ip}`, RATE_LIMITS.login),
    rateLimit(`login:ip:${ip}`, RATE_LIMITS.loginPerIp),
    rateLimit(`login:email:${email}`, RATE_LIMITS.loginPerEmail),
  ]);
  if (allowed.includes(false)) return { ok: false, error: TOO_MANY };

  try {
    // The nextCookies plugin sets the session cookie on this response.
    await auth.api.signInEmail({
      body: { email, password: parsed.data.password },
      headers: await headers(),
    });
  } catch {
    return { ok: false, error: BAD_CREDENTIALS };
  }

  // Checked only after the password, so response time does not reveal which
  // emails belong to admins. A deactivated admin gets the same generic error
  // and the session that was just created is removed.
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, isActive: true },
  });
  if (!user?.isActive) {
    if (user) await prisma.session.deleteMany({ where: { userId: user.id } });
    return { ok: false, error: BAD_CREDENTIALS };
  }
  return { ok: true };
}

export async function signOutAction(): Promise<void> {
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch (error) {
    reportError(error, "auth.signOut");
  }
  redirect("/admin/login");
}

/** Always reports success, whether or not the email belongs to an admin. */
export async function requestPasswordResetAction(
  values: unknown,
): Promise<AdminResult> {
  const parsed = forgotPasswordSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid email.", fieldErrors: toFieldErrors(parsed.error) };
  }
  const email = parsed.data.email.toLowerCase();

  const ip = await getClientIp();
  const allowed = await Promise.all([
    rateLimit(`reset:ip:${ip}`, RATE_LIMITS.passwordResetPerIp),
    rateLimit(`reset:email:${email}`, RATE_LIMITS.passwordResetPerEmail),
  ]);
  if (allowed.includes(false)) return { ok: false, error: TOO_MANY };

  // Looked up and sent after the response, so the reply takes the same time
  // whether or not the email belongs to an admin.
  after(async () => {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { isActive: true },
      });
      if (user?.isActive) {
        await auth.api.requestPasswordReset({
          body: { email, redirectTo: "/admin/reset-password" },
        });
      }
    } catch (error) {
      reportError(error, "auth.requestPasswordReset");
    }
  });
  return { ok: true };
}

export async function resetPasswordAction(values: unknown): Promise<AdminResult> {
  const parsed = resetPasswordSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the form.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  try {
    await auth.api.resetPassword({
      body: { newPassword: parsed.data.password, token: parsed.data.token },
    });
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "This link has expired or was already used. Request a new one.",
    };
  }
}
