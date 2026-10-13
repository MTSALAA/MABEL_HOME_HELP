import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const isDev = process.env.NODE_ENV !== "production";

// Card data is only ever entered on Stripe-hosted pages, so Stripe needs no
// script or frame allowance here. Turnstile is the only third-party script.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // The owner can point a service at a photo hosted anywhere over https.
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' https://challenges.cloudflare.com${isDev ? " ws: wss:" : ""}`,
  "frame-src https://challenges.cloudflare.com",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  // HTTPS only, for this host. Deliberately without includeSubDomains or
  // preload: those would also bind any other subdomain the business uses.
  ...(isDev
    ? []
    : [{ key: "Strict-Transport-Security", value: "max-age=63072000" }]),
];

// Logo and illustrations are plain files that the owner may replace, so they
// are cached for a day and refreshed in the background rather than forever.
const artworkHeaders = [
  {
    key: "Cache-Control",
    value: "public, max-age=86400, stale-while-revalidate=604800",
  },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Lets the end-to-end tests build into their own folder (see
  // playwright.config.ts) without touching the dev server's output.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  // The floating dev badge sits on top of the mobile action bar and form
  // buttons; errors still surface in the terminal and the error overlay.
  devIndicators: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      { source: "/illustrations/:file*", headers: artworkHeaders },
      { source: "/brand/:file*", headers: artworkHeaders },
    ];
  },
};

export default withNextIntl(nextConfig);
