import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

// End-to-end tests run against a production build on their own port and in
// their own build folder, so they never disturb a running `npm run dev`.
// They use the database from .env and clean up the rows they create.
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  timeout: 45_000,
  use: {
    baseURL: BASE_URL,
    // English browser, so the site does not redirect to /fr.
    locale: "en-CA",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Start from an empty build folder: one left by an earlier run makes the
    // next build fail on Windows. The retries cover the moment the previous
    // test server is still shutting down and holding its files.
    command: `node -e "require('fs').rmSync('.next-e2e',{recursive:true,force:true,maxRetries:20,retryDelay:500})" && npx next build && npx next start -p ${PORT}`,
    url: `${BASE_URL}/admin/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: {
      NEXT_DIST_DIR: ".next-e2e",
      NEXT_PUBLIC_SITE_URL: BASE_URL,
      BETTER_AUTH_URL: BASE_URL,
      // The suite submits more forms than a real visitor is allowed to.
      RATE_LIMIT_DISABLED: "true",
    },
  },
});
