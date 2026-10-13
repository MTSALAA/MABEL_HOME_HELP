import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { AUTH_COOKIE_PREFIX } from "@/lib/constants";
import { prisma } from "@/server/db";
import { sendAdminPasswordEmail } from "@/server/email/notifications";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    // Admins are created by the seed script or invited from /admin/users.
    disableSignUp: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
    // Choosing a password through the emailed link proves the address works.
    onPasswordReset: async ({ user }) => {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
    },
    sendResetPassword: async ({ user, url }) => {
      // Invited admins are unverified until they choose their first password.
      await sendAdminPasswordEmail(
        user.email,
        url,
        user.emailVerified ? "reset" : "invite",
      );
    },
  },
  user: {
    additionalFields: {
      isActive: { type: "boolean", defaultValue: true, input: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  // Better Auth's own limiter only covers its HTTP endpoints, and the only one
  // exposed is the GET reset link (see app/api/auth/[...all]/route.ts).
  // Sign-in and reset requests are limited in server/actions/auth.ts.
  rateLimit: { enabled: false },
  advanced: {
    cookiePrefix: AUTH_COOKIE_PREFIX,
  },
  // Must stay last: lets Server Actions set the session cookie.
  plugins: [nextCookies()],
});
