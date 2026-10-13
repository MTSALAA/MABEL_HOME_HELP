import { describe, expect, it } from "vitest";
import { planSchema, settingsSchema } from "@/lib/validation/admin";
import {
  bookingSchema,
  membershipSchema,
  sponsorSchema,
} from "@/lib/validation/public";

const booking = {
  fullName: "Jane Doe",
  phone: "(780) 555-0123",
  email: "",
  requesterRole: "FAMILY",
  serviceId: "svc_1",
  planId: "",
  area: "Edmonton",
  contactMethod: "CALL",
  preferredTime: "",
  message: "",
  consent: true,
};

function firstError(
  result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } },
  field: string,
) {
  return result.error?.issues.find((issue) => issue.path[0] === field)?.message;
}

describe("bookingSchema", () => {
  it("accepts a minimal valid request", () => {
    expect(bookingSchema.safeParse(booking).success).toBe(true);
  });

  it("requires consent", () => {
    const result = bookingSchema.safeParse({ ...booking, consent: false });
    expect(firstError(result, "consent")).toBe("consentRequired");
  });

  it("rejects an invalid phone number", () => {
    const result = bookingSchema.safeParse({ ...booking, phone: "12345" });
    expect(firstError(result, "phone")).toBe("phoneInvalid");
  });

  it("needs an email when the visitor wants to be emailed", () => {
    const result = bookingSchema.safeParse({ ...booking, contactMethod: "EMAIL" });
    expect(firstError(result, "email")).toBe("emailNeededForContact");
    expect(
      bookingSchema.safeParse({
        ...booking,
        contactMethod: "EMAIL",
        email: "jane@example.com",
      }).success,
    ).toBe(true);
  });

  it("accepts real names and rejects text that is not a name", () => {
    for (const fullName of ["Jean-François O’Neil", "María José", "Smith, John Jr."]) {
      expect(bookingSchema.safeParse({ ...booking, fullName }).success).toBe(true);
    }
    for (const fullName of [
      "your account is locked, verify at https://evil.example",
      "Jane <b>Doe</b>",
      "Jane\nDoe",
      "12345",
    ]) {
      const result = bookingSchema.safeParse({ ...booking, fullName });
      expect(firstError(result, "fullName")).toBe("nameInvalid");
    }
  });

  it("limits the message length", () => {
    const result = bookingSchema.safeParse({ ...booking, message: "x".repeat(2001) });
    expect(firstError(result, "message")).toBe("tooLong");
  });
});

describe("sponsorSchema", () => {
  it("requires an email but not a phone", () => {
    const base = {
      fullName: "Sam Lee",
      phone: "",
      email: "sam@example.com",
      organization: "",
      intent: "SPONSOR_VISITS",
      message: "",
      consent: true,
    };
    expect(sponsorSchema.safeParse(base).success).toBe(true);
    expect(firstError(sponsorSchema.safeParse({ ...base, email: "" }), "email")).toBe(
      "required",
    );
  });
});

describe("membershipSchema", () => {
  const membership = {
    payerName: "Jane Doe",
    payerPhone: "780-555-0123",
    payerEmail: "jane@example.com",
    requesterRole: "FAMILY",
    recipientName: "Mabel Doe",
    recipientPhone: "",
    serviceAddress: "123 Main St, Edmonton, AB T5J 0A1",
    area: "Edmonton",
    notes: "",
    consent: true,
  };

  it("accepts a valid sign-up", () => {
    expect(membershipSchema.safeParse(membership).success).toBe(true);
  });

  it("requires the recipient's name unless the visits are for the payer", () => {
    const missing = membershipSchema.safeParse({ ...membership, recipientName: "" });
    expect(firstError(missing, "recipientName")).toBe("recipientRequired");
    expect(
      membershipSchema.safeParse({
        ...membership,
        requesterRole: "SELF",
        recipientName: "",
      }).success,
    ).toBe(true);
  });

  it("requires a real address", () => {
    const result = membershipSchema.safeParse({ ...membership, serviceAddress: "n/a" });
    expect(firstError(result, "serviceAddress")).toBe("addressShort");
  });
});

describe("planSchema", () => {
  const plan = {
    nameEn: "Mabel Check-In",
    nameFr: "",
    priceTextEn: "$200/month",
    priceTextFr: "",
    includesEn: "4 visits",
    includesFr: "",
    noteEn: "",
    noteFr: "",
    slug: "mabel-check-in",
    isActive: true,
    isHighlighted: false,
    isPurchasable: false,
    monthlyAmount: "",
  };

  it("needs a monthly amount only when the plan can be bought online", () => {
    expect(planSchema.safeParse(plan).success).toBe(true);
    const result = planSchema.safeParse({ ...plan, isPurchasable: true });
    expect(firstError(result, "monthlyAmount")).toBeDefined();
    expect(
      planSchema.safeParse({ ...plan, isPurchasable: true, monthlyAmount: "200.00" })
        .success,
    ).toBe(true);
  });

  it("rejects slugs that are not URL-safe", () => {
    const result = planSchema.safeParse({ ...plan, slug: "Mabel Check In" });
    expect(firstError(result, "slug")).toBeDefined();
  });
});

describe("settingsSchema", () => {
  const settings = {
    businessName: "Mabel Home Help",
    taglineEn: "Small jobs. Friendly visits. Peace of mind.",
    taglineFr: "",
    phone: "",
    email: "",
    location: "Edmonton, Alberta, Canada",
    serviceAreasEn: ["Edmonton", "St. Albert"],
    serviceAreasFr: [],
    hoursEn: "",
    hoursFr: "",
    disclaimerEn: "Non-medical services only.",
    disclaimerFr: "",
    notificationEmails: [],
  };

  it("allows phone and email to be empty until the client confirms them", () => {
    expect(settingsSchema.safeParse(settings).success).toBe(true);
  });

  it("keeps the French area list in step with the English one", () => {
    const result = settingsSchema.safeParse({ ...settings, serviceAreasFr: ["Edmonton"] });
    expect(firstError(result, "serviceAreasFr")).toBeDefined();
  });
});
