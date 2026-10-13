import { Atkinson_Hyperlegible, Fraunces } from "next/font/google";

// Warm serif for headings.
export const headingFont = Fraunces({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

// Designed for low-vision readers; used for all body and UI text.
export const bodyFont = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-body",
  display: "swap",
});
