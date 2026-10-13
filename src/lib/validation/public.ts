import { z } from "zod";
import { isValidPhone } from "@/lib/phone";
import { OTHER_AREA, UNSURE } from "./constants";

export { OTHER_AREA, UNSURE };

// Zod normally tests whether it may generate code with new Function(), which
// the site's Content Security Policy (rightly) blocks and reports. These
// schemas are small, so the interpreted path is plenty.
z.config({ jitless: true });

// Messages are keys under Forms.errors in messages/*.json, translated by the
// form components. Keep them in sync with that namespace.

// Letters from any alphabet, plain spaces and the punctuation real names use
// (no digits, line breaks or symbols). The name is echoed back in confirmation
// emails sent from the business's own domain, so it must not be able to carry
// a link or a message to a stranger.
const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M} .,'’-]*$/u;

const fullName = z
  .string()
  .trim()
  .min(2, "nameShort")
  .max(100, "tooLong")
  .regex(NAME_PATTERN, "nameInvalid");

const phone = z
  .string()
  .trim()
  .min(1, "required")
  .max(30, "tooLong")
  .refine(isValidPhone, "phoneInvalid");

const optionalPhone = z
  .string()
  .trim()
  .max(30, "tooLong")
  .refine((value) => value === "" || isValidPhone(value), "phoneInvalid");

const isEmail = (value: string) => z.email().safeParse(value).success;

const email = z
  .string()
  .trim()
  .min(1, "required")
  .max(254, "tooLong")
  .refine(isEmail, "emailInvalid");

const optionalEmail = z
  .string()
  .trim()
  .max(254, "tooLong")
  .refine((value) => value === "" || isEmail(value), "emailInvalid");

const consent = z.boolean().refine((value) => value === true, "consentRequired");

const requesterRole = z.enum(["SELF", "FAMILY", "OTHER"], "required");


export const bookingSchema = z
  .object({
    fullName,
    phone,
    email: optionalEmail,
    requesterRole,
    serviceId: z.string().min(1, "required").max(60),
    planId: z.string().max(60),
    area: z.string().min(1, "required").max(120),
    contactMethod: z.enum(["CALL", "TEXT", "EMAIL"], "required"),
    preferredTime: z.string().trim().max(200, "tooLong"),
    message: z.string().trim().max(2000, "tooLong"),
    consent,
  })
  .refine((data) => data.contactMethod !== "EMAIL" || data.email !== "", {
    path: ["email"],
    message: "emailNeededForContact",
  });

export type BookingInput = z.input<typeof bookingSchema>;

export const contactSchema = z.object({
  fullName,
  phone,
  email: optionalEmail,
  message: z.string().trim().min(5, "messageShort").max(2000, "tooLong"),
  consent,
});

export type ContactInput = z.input<typeof contactSchema>;

export const sponsorSchema = z.object({
  fullName,
  phone: optionalPhone,
  email,
  organization: z.string().trim().max(150, "tooLong"),
  intent: z.enum(["SPONSOR_VISITS", "NOMINATE_SENIOR", "OTHER"], "required"),
  message: z.string().trim().max(2000, "tooLong"),
  consent,
});

export type SponsorInput = z.input<typeof sponsorSchema>;

export const membershipSchema = z
  .object({
    payerName: fullName,
    payerPhone: phone,
    payerEmail: email,
    requesterRole,
    recipientName: z
      .string()
      .trim()
      .max(100, "tooLong")
      .refine((value) => value === "" || NAME_PATTERN.test(value), "nameInvalid"),
    recipientPhone: optionalPhone,
    serviceAddress: z.string().trim().min(8, "addressShort").max(300, "tooLong"),
    area: z.string().min(1, "required").max(120),
    notes: z.string().trim().max(1000, "tooLong"),
    consent,
  })
  .refine(
    (data) => data.requesterRole === "SELF" || data.recipientName.length >= 2,
    { path: ["recipientName"], message: "recipientRequired" },
  );

export type MembershipInput = z.input<typeof membershipSchema>;

export const manageSchema = z.object({ email });

export type ManageInput = z.input<typeof manageSchema>;

/** Sent alongside every public form: locale plus spam-protection fields. */
export const formMetaSchema = z.object({
  locale: z.enum(["en", "fr"]),
  turnstileToken: z.string().max(4096).optional(),
  // Honeypot: real visitors never fill this in.
  website: z.string().max(200).optional(),
});

export type FormMeta = z.infer<typeof formMetaSchema>;

export type PublicFormError =
  | "validation"
  | "rateLimited"
  | "spam"
  | "unavailable"
  | "server";

export type PublicFormResult<T = unknown> =
  | ({ ok: true } & T)
  | { ok: false; error: PublicFormError };
