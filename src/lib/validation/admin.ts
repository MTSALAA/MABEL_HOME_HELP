import { z } from "zod";
import { SERVICE_ILLUSTRATIONS } from "@/lib/constants";
import { isValidPhone } from "@/lib/phone";

// See validation/public.ts: avoids a blocked new Function() probe under the CSP.
z.config({ jitless: true });

// Every message below is a key of "Admin.Validation" in messages/*.json, not
// the text itself: the admin exists in English and French. Forms turn a key
// into text with useValidationMessage() (components/admin/form-fields.tsx).

const requiredText = (max: number) =>
  z.string().trim().min(1, "required").max(max, "tooLong");

const optionalText = (max: number) => z.string().trim().max(max, "tooLong");

const slug = z
  .string()
  .trim()
  .min(2, "slugShort")
  .max(80, "slugLong")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "slugFormat",
  );

export const serviceSchema = z.object({
  titleEn: requiredText(120),
  titleFr: optionalText(120),
  descriptionEn: requiredText(600),
  descriptionFr: optionalText(600),
  slug,
  illustration: z.enum(SERVICE_ILLUSTRATIONS, "illustration"),
  imageUrl: z
    .string()
    .trim()
    .max(500, "tooLong")
    .refine(
      (value) => value === "" || /^https:\/\/[^\s]+$/.test(value),
      "httpsUrl",
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
    monthlyAmount: z.string().trim().max(12, "tooLong"),
  })
  .refine(
    (data) =>
      !data.isPurchasable || /^\d{1,5}(\.\d{1,2})?$/.test(data.monthlyAmount),
    {
      path: ["monthlyAmount"],
      message: "monthlyAmount",
    },
  )
  .refine(
    (data) => !data.isPurchasable || Number(data.monthlyAmount) >= 1,
    { path: ["monthlyAmount"], message: "amountMin" },
  );

export type PlanInput = z.input<typeof planSchema>;

const areaList = z
  .array(z.string().trim().min(1, "required").max(80, "tooLong"))
  .max(30, "tooManyAreas");

export const settingsSchema = z
  .object({
    businessName: requiredText(100),
    taglineEn: requiredText(160),
    taglineFr: optionalText(160),
    phone: z
      .string()
      .trim()
      .max(30, "tooLong")
      .refine((value) => value === "" || isValidPhone(value), "phone"),
    email: z
      .string()
      .trim()
      .max(254, "tooLong")
      .refine(
        (value) => value === "" || z.email().safeParse(value).success,
        "emailOrEmpty",
      ),
    location: requiredText(120),
    serviceAreasEn: areaList.min(1, "areaRequired"),
    serviceAreasFr: areaList,
    hoursEn: optionalText(200),
    hoursFr: optionalText(200),
    disclaimerEn: requiredText(600),
    disclaimerFr: optionalText(600),
    notificationEmails: z
      .array(z.email("notificationEmail"))
      .max(10, "tooManyNotificationEmails"),
    // Language of the emails sent to the team.
    staffLocale: z.enum(["EN", "FR"], "required"),
  })
  .refine(
    (data) =>
      data.serviceAreasFr.length === 0 ||
      data.serviceAreasFr.length === data.serviceAreasEn.length,
    {
      path: ["serviceAreasFr"],
      message: "areasMismatch",
    },
  );

export type SettingsInput = z.input<typeof settingsSchema>;

export const loginSchema = z.object({
  email: z.email("email"),
  password: z.string().min(1, "password").max(200, "tooLong"),
});

export type LoginInput = z.input<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.email("email"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1).max(500),
    password: z
      .string()
      .min(10, "passwordMin")
      .max(128, "tooLong"),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    path: ["confirm"],
    message: "passwordMismatch",
  });

export const inviteUserSchema = z.object({
  name: requiredText(100),
  email: z.email("email"),
});

export type InviteUserInput = z.input<typeof inviteUserSchema>;

export const notesSchema = z.object({
  notes: z.string().trim().max(5000, "tooLong"),
});

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
  // `error` is ready-to-show text in the admin's language; `fieldErrors`
  // holds "Admin.Validation" keys.
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/**
 * Flattens a ZodError into one entry per field for admin forms. The values are
 * "Admin.Validation" keys (see the top of this file), translated by the form.
 */
export function toFieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!(key in result)) result[key] = issue.message;
  }
  return result;
}
