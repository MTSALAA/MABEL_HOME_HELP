import { expect, test, type Page } from "@playwright/test";
import { hasAdminCredentials, prisma, signIn } from "./helpers";

// Every screen is loaded at each of these widths and must not scroll sideways
// or cut off text. French is checked too because its labels run longer.
const VIEWPORTS = [
  { name: "small phone", width: 360, height: 740 },
  { name: "large phone", width: 414, height: 896 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "small laptop", width: 1024, height: 768 },
  { name: "laptop", width: 1280, height: 800 },
  { name: "desktop", width: 1536, height: 864 },
] as const;

const PUBLIC_PATHS = [
  "/",
  "/services",
  "/pricing",
  "/book",
  "/about",
  "/contact",
  "/sponsor-a-senior",
  "/membership/mabel-check-in",
  "/membership/manage",
  "/membership/success",
  "/privacy",
  "/terms",
  "/this-page-does-not-exist",
];

type LayoutReport = {
  viewportWidth: number;
  scrollWidth: number;
  overflowing: string[];
  clipped: string[];
};

/** Measures the rendered page for sideways scroll and cut-off text. */
async function inspectLayout(page: Page): Promise<LayoutReport> {
  return page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const describe = (el: Element) => {
      const text = (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
      const classes = el.getAttribute("class")?.split(/\s+/).slice(0, 4).join(".") ?? "";
      return `<${el.tagName.toLowerCase()}${classes ? `.${classes}` : ""}> "${text}"`;
    };
    const isScrollableOrClipped = (el: Element | null): boolean => {
      for (let node = el; node && node !== document.body; node = node.parentElement) {
        const overflowX = getComputedStyle(node).overflowX;
        if (overflowX !== "visible") return true;
      }
      return false;
    };

    const overflowing: string[] = [];
    const clipped: string[] = [];
    for (const el of document.querySelectorAll("body *")) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      const style = getComputedStyle(el);
      if (
        style.visibility === "hidden" ||
        // Screen-reader-only content (such as the skip link) is clipped on purpose.
        style.clipPath !== "none" ||
        el.closest("[aria-hidden='true'], [hidden]")
      ) {
        continue;
      }

      // Sticks out past the right edge, and nothing above it scrolls or clips.
      if (rect.right > viewportWidth + 1 && !isScrollableOrClipped(el.parentElement)) {
        overflowing.push(describe(el));
      }

      // Text that is cut off without an ellipsis was not meant to be cut off.
      const hasOwnText = Array.from(el.childNodes).some(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
      );
      if (
        hasOwnText &&
        el.scrollWidth > el.clientWidth + 1 &&
        ["hidden", "clip"].includes(style.overflowX) &&
        style.textOverflow !== "ellipsis" &&
        rect.width > 1
      ) {
        clipped.push(describe(el));
      }
    }

    return {
      viewportWidth,
      scrollWidth: document.documentElement.scrollWidth,
      overflowing: overflowing.slice(0, 6),
      clipped: clipped.slice(0, 6),
    };
  });
}

async function expectSoundLayout(page: Page, path: string) {
  await page.goto(path);
  // Measure once the streamed content and web fonts are in place. (Waiting
  // for the network to go idle would also wait for every link prefetch.)
  await page.locator("h1").first().waitFor();
  await page.evaluate(() => document.fonts.ready);

  const report = await inspectLayout(page);
  expect
    .soft(report.overflowing, `${path}: elements wider than the screen`)
    .toEqual([]);
  expect
    .soft(report.scrollWidth, `${path}: page scrolls sideways`)
    .toBeLessThanOrEqual(report.viewportWidth);
  expect.soft(report.clipped, `${path}: text is cut off`).toEqual([]);
}

for (const viewport of VIEWPORTS) {
  test.describe(`${viewport.name} (${viewport.width}px)`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("public pages fit the screen in English and French", async ({ page }) => {
      test.setTimeout(120_000);
      for (const path of PUBLIC_PATHS) {
        await expectSoundLayout(page, path);
        await expectSoundLayout(page, `/fr${path === "/" ? "" : path}`);
      }
    });

    test("admin screens fit the screen", async ({ page }) => {
      test.skip(!hasAdminCredentials, "SEED_ADMIN_* must be set in .env");
      test.setTimeout(120_000);

      const [request, plan, service] = await Promise.all([
        prisma.bookingRequest.findFirst({ orderBy: { createdAt: "desc" } }),
        prisma.plan.findFirst({ orderBy: { sortOrder: "asc" } }),
        prisma.service.findFirst({ orderBy: { sortOrder: "asc" } }),
      ]);

      await expectSoundLayout(page, "/admin/login");
      await expectSoundLayout(page, "/admin/forgot-password");
      await signIn(page);

      const paths = [
        "/admin",
        "/admin/requests",
        "/admin/members",
        "/admin/sponsors",
        "/admin/services",
        "/admin/services/new",
        "/admin/plans",
        "/admin/plans/new",
        "/admin/settings",
        "/admin/users",
        ...(request ? [`/admin/requests/${request.id}`] : []),
        ...(plan ? [`/admin/plans/${plan.id}`] : []),
        ...(service ? [`/admin/services/${service.id}`] : []),
      ];
      for (const path of paths) {
        await expectSoundLayout(page, path);
      }
    });
  });
}

test.afterAll(async () => {
  await prisma.$disconnect();
});
