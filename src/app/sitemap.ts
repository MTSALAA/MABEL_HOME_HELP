import type { MetadataRoute } from "next";
import { localizedUrl } from "@/lib/metadata";

// Indexable public pages. Membership sign-up, success and manage pages are
// noindex and deliberately left out.
const PATHS = [
  { path: "/", priority: 1 },
  { path: "/services", priority: 0.9 },
  { path: "/pricing", priority: 0.9 },
  { path: "/book", priority: 0.8 },
  { path: "/about", priority: 0.7 },
  { path: "/contact", priority: 0.7 },
  { path: "/sponsor-a-senior", priority: 0.6 },
  { path: "/privacy", priority: 0.2 },
  { path: "/terms", priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PATHS.flatMap(({ path, priority }) =>
    (["en", "fr"] as const).map((locale) => ({
      url: localizedUrl(path, locale),
      changeFrequency: "monthly" as const,
      priority,
      alternates: {
        languages: {
          "en-CA": localizedUrl(path, "en"),
          "fr-CA": localizedUrl(path, "fr"),
        },
      },
    })),
  );
}
