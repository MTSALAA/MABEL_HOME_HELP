import { expect, test } from "@playwright/test";
import {
  adminEmail,
  hasAdminCredentials,
  prisma,
  signIn,
  uniqueName,
} from "./helpers";

// Every row a test creates carries this marker so it can be removed afterwards.
const MARKER = "Automated Test";

async function cleanUp() {
  await prisma.bookingRequest.deleteMany({
    where: { fullName: { startsWith: MARKER } },
  });
  await prisma.sponsorInquiry.deleteMany({
    where: { fullName: { startsWith: MARKER } },
  });
}

test.beforeAll(cleanUp);
test.afterAll(async () => {
  await cleanUp();
  await prisma.$disconnect();
});

test.describe("public site", () => {
  test("a visitor submits the booking form and the request is stored", async ({
    page,
  }) => {
    const name = uniqueName(`${MARKER} Booking`);
    await page.goto("/book?service=snow-removal");

    // The link from a service card pre-selects that service.
    await expect(page.getByLabel("Service", { exact: true })).toHaveValue(/.+/);

    await page.getByLabel("Full name").fill(name);
    await page.getByLabel("Phone number").fill("780-555-0142");
    await page.getByLabel("City or area").selectOption({ label: "Edmonton" });
    await page.getByText("Text me").click();
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Send my request" }).click();

    await expect(
      page.getByRole("heading", { name: "Thank you, your request is in" }),
    ).toBeVisible();

    const stored = await prisma.bookingRequest.findFirst({
      where: { fullName: name },
      include: { service: true },
    });
    expect(stored).not.toBeNull();
    expect(stored?.phone).toBe("7805550142");
    expect(stored?.contactMethod).toBe("TEXT");
    expect(stored?.service?.slug).toBe("snow-removal");
    expect(stored?.status).toBe("NEW");
  });

  test("an invalid booking form shows field errors and stores nothing", async ({
    page,
  }) => {
    const before = await prisma.bookingRequest.count();
    await page.goto("/book");
    await page.getByRole("button", { name: "Send my request" }).click();

    await expect(page.getByText("Please enter a full name.")).toBeVisible();
    await expect(page.getByText("Please tick the box to continue.")).toBeVisible();
    expect(await prisma.bookingRequest.count()).toBe(before);
  });

  test("the contact form stores a general message", async ({ page }) => {
    const name = uniqueName(`${MARKER} Contact`);
    await page.goto("/contact");
    await page.getByLabel("Full name").fill(name);
    await page.getByLabel("Phone number").fill("780-555-0143");
    await page.getByLabel("How can we help?").fill("A question about pricing.");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Send message" }).click();

    await expect(page.getByRole("heading", { name: "Message sent" })).toBeVisible();
    const stored = await prisma.bookingRequest.findFirst({ where: { fullName: name } });
    expect(stored?.type).toBe("GENERAL");
  });

  test("switching to French stays on the same page, with English fallback", async ({
    page,
  }) => {
    await page.goto("/services");
    await page.getByRole("link", { name: /Français/ }).first().click();

    await expect(page).toHaveURL(/\/fr\/services$/);
    await expect(page.getByRole("heading", { level: 1, name: "Nos services" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Déneigement" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "fr-CA");

    // Plan brand names have no French version, so the English name is shown.
    await page.goto("/fr/pricing");
    await expect(page.getByRole("heading", { name: "Quick Drop" })).toBeVisible();
    await expect(page.getByText("15 $ à 20 $ par visite")).toBeVisible();
  });

  test("the scope disclaimer is on every page", async ({ page }) => {
    for (const path of ["/", "/services", "/pricing", "/about", "/contact", "/fr/book"]) {
      await page.goto(path);
      await expect(page.getByRole("contentinfo")).toContainText(
        /non-medical|non médicaux/,
      );
    }
  });

  test("unknown pages show the localized not-found page", async ({ page }) => {
    const response = await page.goto("/fr/does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { name: "Nous n'avons pas trouvé cette page" }),
    ).toBeVisible();
  });
});

test.describe("phone action bar", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("steps aside while scrolling down and comes back on the way up", async ({
    page,
  }) => {
    await page.goto("/services");
    const bar = page.getByRole("navigation", { name: "Quick contact actions" });
    await expect(bar).toBeInViewport();

    await page.mouse.wheel(0, 900);
    await expect(bar).toHaveAttribute("data-hidden", "true");
    await expect(bar).not.toBeInViewport();

    await page.mouse.wheel(0, -200);
    await expect(bar).not.toHaveAttribute("data-hidden", "true");
    await expect(bar).toBeInViewport();
  });

  test("stays away while the page's own buttons are on screen", async ({ page }) => {
    // The home page opens with Call, Text and Book: no second set below them.
    await page.goto("/");
    const bar = page.getByRole("navigation", { name: "Quick contact actions" });
    await expect(page.getByRole("link", { name: "Book a Service" }).first()).toBeInViewport();
    await expect(bar).toHaveAttribute("data-hidden", "true");

    // Further down, scrolling back up brings it in.
    await page.mouse.wheel(0, 1600);
    await page.mouse.wheel(0, -200);
    await expect(bar).not.toHaveAttribute("data-hidden", "true");
    await expect(bar).toBeInViewport();
  });

  test("is left out of the booking page and hides while typing", async ({ page }) => {
    await page.goto("/book");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Quick contact actions" }),
    ).toHaveCount(0);

    await page.goto("/contact");
    const bar = page.getByRole("navigation", { name: "Quick contact actions" });
    await expect(bar).toBeInViewport();
    await page.getByLabel("Full name").focus();
    await expect(bar).toHaveAttribute("data-hidden", "true");
  });
});

test.describe("admin", () => {
  test.skip(
    !hasAdminCredentials,
    "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in .env",
  );

  test("the dashboard can be switched to French and back", async ({ page }) => {
    await signIn(page);
    const sidebar = page.getByRole("complementary");
    await expect(sidebar.getByRole("link", { name: "Overview" })).toBeVisible();

    await sidebar.getByRole("button", { name: "Français" }).click();
    await expect(sidebar.getByRole("link", { name: "Vue d'ensemble" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "fr-CA");

    // The choice is remembered, on every screen, including a fresh load.
    await page.goto("/admin/settings");
    await expect(page.getByRole("heading", { level: 1, name: "Paramètres" })).toBeVisible();
    await page.goto("/admin/requests");
    await expect(page.getByRole("heading", { level: 1, name: "Demandes" })).toBeVisible();
    await expect(page).toHaveTitle(/Demandes/);

    await page.getByRole("complementary").getByRole("button", { name: "English" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Requests" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en-CA");
  });

  test("the sign-in page follows the browser language until one is chosen", async ({
    browser,
  }) => {
    const context = await browser.newContext({ locale: "fr-CA" });
    const page = await context.newPage();
    await page.goto("/admin/login");
    await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();
    await expect(page.getByLabel("Courriel")).toBeVisible();

    await page.getByRole("button", { name: "English" }).click();
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await page.reload();
    await expect(page.getByLabel("Email")).toBeVisible();
    await context.close();
  });

  test("the admin is not reachable without signing in", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
    await page.goto("/admin/requests");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("a wrong password is rejected", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(adminEmail);
    await page.getByLabel("Password").fill("definitely-not-the-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Incorrect email or password.")).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("editing a plan price updates the public pricing page", async ({ page }) => {
    const plan = await prisma.plan.findUniqueOrThrow({ where: { slug: "quick-drop" } });
    const temporary = `$${Date.now() % 1000} test price`;
    await signIn(page);

    async function setPrice(value: string) {
      await page.goto(`/admin/plans/${plan.id}`);
      await page.getByLabel("Price shown on the website").fill(value);
      await page.getByRole("button", { name: "Save changes" }).click();
      await expect(page).toHaveURL(/\/admin\/plans$/);
    }

    try {
      await setPrice(temporary);
      await page.goto("/pricing");
      await expect(page.getByText(temporary)).toBeVisible();
    } finally {
      await setPrice(plan.priceTextEn);
    }
    await page.goto("/pricing");
    await expect(page.getByText(plan.priceTextEn)).toBeVisible();
  });

  test("updating the phone number updates the site header", async ({ page }) => {
    const settings = await prisma.siteSettings.findUniqueOrThrow({ where: { id: 1 } });
    await signIn(page);

    async function setPhone(value: string) {
      await page.goto("/admin/settings");
      await page.getByLabel("Phone number").fill(value);
      await page.getByRole("button", { name: "Save settings" }).click();
      await expect(page.getByText("Settings saved.")).toBeVisible();
    }

    try {
      await setPhone("(780) 555-0147");
      await page.goto("/");
      await expect(
        page.getByRole("link", { name: "Call (780) 555-0147" }).first(),
      ).toHaveAttribute("href", "tel:+17805550147");
    } finally {
      await setPhone(settings.phone ?? "");
    }
  });

  test("a request can be moved through statuses and annotated", async ({ page }) => {
    const request = await prisma.bookingRequest.create({
      data: {
        fullName: `${MARKER} Status ${Date.now()}`,
        phone: "7805550144",
        consentAt: new Date(),
      },
    });
    await signIn(page);

    await page.goto(`/admin/requests/${request.id}`);
    await page.getByLabel("Status").selectOption("CONTACTED");
    await expect(page.getByText("Status updated.")).toBeVisible();

    await page.getByLabel("Private notes").fill("Called, will visit Tuesday.");
    await page.getByRole("button", { name: "Save notes" }).click();
    await expect(page.getByText("Notes saved.")).toBeVisible();

    const updated = await prisma.bookingRequest.findUniqueOrThrow({
      where: { id: request.id },
    });
    expect(updated.status).toBe("CONTACTED");
    expect(updated.adminNotes).toBe("Called, will visit Tuesday.");

    // It shows up in the inbox and can be found by name.
    await page.goto(`/admin/requests?q=${encodeURIComponent(request.fullName)}`);
    await expect(page.getByText(request.fullName)).toBeVisible();
  });
});
