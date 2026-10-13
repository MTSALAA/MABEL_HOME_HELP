import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/server/auth";

// Only GET is exposed: it serves the emailed password-reset link
// (/api/auth/reset-password/:token). Sign-in, sign-out and reset requests go
// through the Server Actions in src/server/actions/auth.ts, which apply the
// rate limits and the active-admin check. Exporting POST here would let
// anyone call Better Auth's sign-in endpoint directly and skip both.
export const { GET } = toNextJsHandler(auth);
