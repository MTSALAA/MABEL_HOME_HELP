import { ImageResponse } from "next/og";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { getSettings } from "@/server/queries/content";

export const alt = "Mabel Home Help";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Social share image, one per language, drawn from the live tagline.
export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const settings = await getSettings(
    hasLocale(routing.locales, locale) ? locale : routing.defaultLocale,
  );
  const lines = settings.tagline.split(/(?<=[.!?])\s+/).filter(Boolean);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          backgroundColor: "#1F3D2B",
          color: "#FBF8F1",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <svg width="104" height="104" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="14" fill="#2F5D43" />
            <path
              d="M10.5 24.5 24 12.5l13.5 12"
              stroke="#FBF8F1"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14.5 22.5V33a3 3 0 0 0 3 3h13a3 3 0 0 0 3-3V22.5"
              stroke="#FBF8F1"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M24 32.6c-3.5-2.3-5.1-4.1-5.1-6.1a2.65 2.65 0 0 1 5.1-1 2.65 2.65 0 0 1 5.1 1c0 2-1.6 3.8-5.1 6.1Z"
              fill="#E3A857"
            />
          </svg>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1 }}>Mabel</div>
            <div
              style={{
                marginTop: 10,
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: 8,
                color: "#9CC5AB",
              }}
            >
              HOME HELP
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {lines.map((line, index) => (
            <div
              key={line}
              style={{
                fontSize: 82,
                fontWeight: 700,
                lineHeight: 1.12,
                color: index === lines.length - 1 ? "#E3A857" : "#FBF8F1",
              }}
            >
              {line}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", fontSize: 30, color: "#E3EFE6" }}>
          {settings.serviceAreas.slice(0, 3).join("  ·  ")}
        </div>
      </div>
    ),
    size,
  );
}
