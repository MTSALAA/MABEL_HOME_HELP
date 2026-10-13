import { PrismaClient } from "@prisma/client";
import { expect, type Page } from "@playwright/test";

export const prisma = new PrismaClient();

export const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "";
export const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "";
export const hasAdminCredentials = Boolean(adminEmail && adminPassword);

export async function signIn(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(adminEmail);
  await page.getByLabel("Password").fill(adminPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

/** A unique, letters-only name: public forms reject digits in names. */
export function uniqueName(prefix: string): string {
  const letters = Date.now()
    .toString()
    .replace(/\d/g, (digit) => "abcdefghij"[Number(digit)]);
  return `${prefix} ${letters}`;
}
