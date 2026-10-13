import { headers } from "next/headers";

/** Best-effort client IP, used only as a rate-limit key. */
export async function getClientIp(): Promise<string> {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return requestHeaders.get("x-real-ip")?.trim() || "unknown";
}
