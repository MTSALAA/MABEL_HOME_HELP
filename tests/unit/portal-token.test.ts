import { describe, expect, it } from "vitest";
import { PORTAL_LINK_TTL_MS } from "@/lib/constants";
import { createPortalToken, verifyPortalToken } from "@/server/portal-token";

describe("portal token", () => {
  const now = 1_800_000_000_000;

  it("round-trips the Stripe customer id", () => {
    const token = createPortalToken("cus_123", now);
    expect(verifyPortalToken(token, now + 1000)).toBe("cus_123");
  });

  it("expires after the link lifetime", () => {
    const token = createPortalToken("cus_123", now);
    expect(verifyPortalToken(token, now + PORTAL_LINK_TTL_MS + 1)).toBeNull();
  });

  it("rejects a tampered payload or signature", () => {
    const token = createPortalToken("cus_123", now);
    const [payload, signature] = token.split(".");
    const forgedPayload = Buffer.from(
      JSON.stringify({ c: "cus_other", e: now + PORTAL_LINK_TTL_MS }),
    ).toString("base64url");

    expect(verifyPortalToken(`${forgedPayload}.${signature}`, now)).toBeNull();
    expect(verifyPortalToken(`${payload}.${signature.slice(0, -2)}xx`, now)).toBeNull();
    expect(verifyPortalToken("garbage", now)).toBeNull();
    expect(verifyPortalToken("", now)).toBeNull();
  });
});
