import { ImageResponse } from "next/og";

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
        <svg width="180" height="180" viewBox="0 0 48 48" fill="none">
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
      </div>
    ),
    size,
  );
}
