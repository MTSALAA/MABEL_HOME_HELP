import { z } from "zod";
import { SERVICE_ILLUSTRATIONS } from "@/lib/constants";
import { isValidPhone } from "@/lib/phone";

// See validation/public.ts: avoids a blocked new Function() probe under the CSP.
z.config({ jitless: true });

const requiredText = (max: number) =>
  z.string().trim().min(1, "This field is required.").max(max, "Too long.");

const optionalText = (max: number) => z.string().trim().max(max, "Too long.");

const slug = z
  .string()
  .trim()
  .min(2, "Slug is too short.")
  .max(80, "Slug is too long.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers and dashes only.",
  );

export const serviceSchema = z.object({
  titleEn: requiredText(120),
  titleFr: optionalText(120),
  descriptionEn: requiredText(600),
  descriptionFr: optionalText(600),
  slug,
  illustration: z.enum(SERVICE_ILLUSTRATIONS, "Choose an illustration."),
  imageUrl: z
    .string()
    .trim()
    .max(500)
    .refine(
      (value) => value === "" || /^https:\/\/[^\s]+$/.test(value),
      "Must be an https:// address.",
    ),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
});

export type ServiceInput = z.input<typeof serviceSchema>;

export const planSchema = z
  .object({
    nameEn: requiredText(80),
    nameFr: optionalText(80),
    priceTextEn: requiredText(80),
    priceTextFr: optionalText(80),
    includesEn: requiredText(200),
    includesFr: optionalText(200),
    noteEn: optionalText(300),
    noteFr: optionalText(300),
    slug,
    isActive: z.boolean(),
    isHighlighted: z.boolean(),
    isPurchasable: z.boolean(),
    // Dollars as typed by the owner, e.g. "200" or "200.00".
    monthlyAmount: z.string().trim().max(12),
  })
  .refine(
    (data) =>
      !data.isPurchasable || /^\d{1,5}(\.\d{1,2})?$/.test(data.monthlyAmount),
    {
      path: ["monthlyAmount"],
      message: "Enter the monthly amount in dollars, for example 200 or 199.99.",
    },
  )
  .refine(
    (data) => !data.isPurchasable || Number(data.monthlyAmount) >= 1,
    { path: ["monthlyAmount"], message: "The amount must be at least $1." },
  );

export type PlanInput = z.input<typeof planSchema>;

const areaList = z
  .array(z.string().trim().min(1).max(80))
  .max(30, "Too many areas.");

export const settingsSchema = z
  .object({
    businessName: requiredText(100),
    taglineEn: requiredText(160),
    taglineFr: optionalText(160),
    phone: z
      .string()
      .trim()
      .max(30)
      .refine(
        (value) => value === "" || isValidPhone(value),
        "Enter a valid 10-digit phone number, or leave it empty.",
      ),
    email: z
      .string()
      .trim()
      .max(254)
      .refine(
        (value) => value === "" || z.email().safeParse(value).success,
        "Enter a valid email, or leave it empty.",
      ),
    location: requiredText(120),
    serviceAreasEn: areaList.min(1, "Add at least one service area."),
    serviceAreasFr: areaList,
    hoursEn: optionalText(200),
    hoursFr: optionalText(200),
    disclaimerEn: requiredText(600),
    disclaimerFr: optionalText(600),
    notificationEmails: z
      .array(z.email("One of the notification emails is not valid."))
      .max(10, "Too many notification emails."),
  })
  .refine(
    (data) =>
      data.serviceAreasFr.length === 0 ||
      data.serviceAreasFr.length === data.serviceAreasEn.length,
    {
      path: ["serviceAreasFr"],
      message:
        "The French list must have the same number of areas, in the same order, as the English list (or be empty).",
    },
  );

export type SettingsInput = z.input<typeof settingsSchema>;

export const loginSchema = z.object({
  email: z.email("Enter a valid email."),
  password: z.string().min(1, "Enter your password.").max(200),
});

export type LoginInput = z.input<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email."),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1).max(500),
    password: z
      .string()
      .min(10, "Use at least 10 characters.")
      .max(128, "Too long."),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    path: ["confirm"],
    message: "The passwords don't match.",
  });

export const inviteUserSchema = z.object({
  name: requiredText(100),
  email: z.email("Enter a valid email."),
});

export type InviteUserInput = z.input<typeof inviteUserSchema>;

export const notesSchema = z.object({
  notes: z.string().trim().max(5000, "Too long."),
});

/** Generic reply when a Server Action is called with arguments it can't use. */
export const INVALID = "That request was not valid. Refresh the page and try again.";

const idSchema = z.string().min(1).max(64);

/** Server Action arguments arrive untyped; ids must really be short strings. */
export function isId(value: unknown): value is string {
  return idSchema.safeParse(value).success;
}

export function isIdList(value: unknown): value is string[] {
  return z.array(idSchema).max(200).safeParse(value).success;
}

export type AdminResult<T = unknown> =
  | ({ ok: true } & T)
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Flattens a ZodError into one message per field for admin forms. */
export function toFieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!(key in result)) result[key] = issue.message;
  }
  return result;
}
