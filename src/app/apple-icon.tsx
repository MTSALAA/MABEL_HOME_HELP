import { ImageResponse } from "next/og";
import { BRAND_COLORS, BRAND_MARK } from "@/lib/brand";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// PNG version of the logo mark for iOS home screens and older browsers.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#2F5D43",
        }}
      >
        <svg width="180" height="180" viewBox={BRAND_MARK.tileViewBox} fill="none">
          <path
            d={BRAND_MARK.roof}
            stroke={BRAND_COLORS.cream}
            strokeWidth={5.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={BRAND_MARK.letter}
            stroke={BRAND_COLORS.cream}
            strokeWidth={5.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d={BRAND_MARK.heart} fill={BRAND_COLORS.honey} />
        </svg>
      </div>
    ),
    size,
  );
}
