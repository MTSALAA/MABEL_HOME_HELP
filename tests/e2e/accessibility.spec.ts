import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { hasAdminCredentials, signIn } from "./helpers";

// Automated WCAG 2.1 / 2.2 level A and AA checks (colour contrast, labels,
// landmarks, heading order, ARIA use). This catches regressions; it does not
// replace a pass with a keyboard and a screen reader.
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function expectNoViolations(page: Page, path: string) {
  await page.goto(path);
  await page.locator("h1").first().waitFor();
  await page.evaluate(() => document.fonts.ready);

  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const summary = violations.map(
    (violation) =>
      `${violation.id} (${violation.impact}): ${violation.help} | ${violation.nodes
        .slice(0, 3)
        .map((node) => node.target.join(" "))
        .join(" ; ")}`,
  );
  expect.soft(summary, `${path}: accessibility violations`).toEqual([]);
}

const PUBLIC_PATHS = [
  "/",
  "/services",
  "/pricing",
  "/book",
  "/about",
  "/contact",
  "/sponsor-a-senior",
  "/membership/manage",
  "/privacy",
  "/fr",
  "/fr/book",
  "/fr/pricing",
];

test.describe("accessibility", () => {
  test("public pages on a desktop screen", async ({ page }) => {
    test.setTimeout(120_000);
    for (const path of PUBLIC_PATHS) {
      await expectNoViolations(page, path);
    }
  });

  test.describe("on a phone", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("public pages, with the action bar and mobile menu", async ({ page }) => {
      test.setTimeout(120_000);

      // The open mobile menu first, while the session is still in English
      // (visiting a French page makes the site remember French).
      await page.goto("/");
      await page.getByRole("button", { name: "Open menu" }).click();
      await page.getByRole("dialog").waitFor();
      const { violations } = await new AxeBuilder({ page })
        .withTags(WCAG_TAGS)
        .include("dialog[open]")
        .analyze();
      expect(violations.map((violation) => violation.id)).toEqual([]);

      for (const path of ["/", "/book", "/contact", "/fr/pricing"]) {
        await expectNoViolations(page, path);
      }
    });

    test("the menu closes with Escape, returns focus and follows links", async ({
      page,
    }) => {
      await page.goto("/");
      const openButton = page.getByRole("button", { name: "Open menu" });
      await openButton.click();
      const menu = page.getByRole("dialog");
      await expect(menu).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(menu).toBeHidden();
      await expect(openButton).toBeFocused();

      await openButton.click();
      await menu.getByRole("link", { name: "Pricing" }).click();
      await expect(page).toHaveURL(/\/pricing$/);
      await expect(page.getByRole("dialog")).toBeHidden();
    });
  });

  test("an invalid form announces its errors accessibly", async ({ page }) => {
    await page.goto("/book");
    await page.getByRole("button", { name: "Send my request" }).click();
    await expect(page.getByText("Please enter a full name.")).toBeVisible();

    // The first invalid field takes focus and is described by its error.
    const name = page.getByLabel("Full name");
    await expect(name).toBeFocused();
    await expect(name).toHaveAttribute("aria-invalid", "true");
    await expect(name).toHaveAccessibleDescription(/Please enter a full name\./);

    const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(violations.map((violation) => violation.id)).toEqual([]);
  });

  test("admin screens", async ({ page }) => {
    test.skip(!hasAdminCredentials, "SEED_ADMIN_* must be set in .env");
    test.setTimeout(120_000);

    await expectNoViolations(page, "/admin/login");
    await signIn(page);
    for (const path of [
      "/admin",
      "/admin/requests",
      "/admin/services",
      "/admin/plans",
      "/admin/plans/new",
      "/admin/settings",
      "/admin/users",
    ]) {
      await expectNoViolations(page, path);
    }
  });
});
