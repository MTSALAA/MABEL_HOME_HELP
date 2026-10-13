import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    env: {
      BETTER_AUTH_SECRET: "unit-test-secret-not-used-anywhere-else",
      NEXT_PUBLIC_SITE_URL: "https://example.test",
    },
  },
});
