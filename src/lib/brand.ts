/**
 * The Mabel Home Help mark: an M under a roof, with a heart where they meet.
 * Drawn on a 64 x 64 grid. Kept here so the header, the browser and phone
 * icons and the share image all draw exactly the same shape; the files in
 * public/brand and src/app/icon.svg are copies for places that need a file.
 * To change the logo, start in docs/brand (other options are kept there).
 */
export const BRAND_MARK = {
  viewBox: "0 0 64 64",
  roof: "M8.5 28.5 32 8.5l23.5 20",
  letter: "M17 54.5V34l15 13.5L47 34v20.5",
  heart:
    "M32 33.9s-5.25-3.22-5.25-7.14A3.01 3.01 0 0 1 32 24.94a3.01 3.01 0 0 1 5.25 1.82C37.25 30.68 32 33.9 32 33.9z",
  strokeWidth: 5.2,
  /** Shows the same drawing at about 73% in the middle of a solid tile. */
  tileViewBox: "-11.8 -12.2 87.7 87.7",
} as const;

export const BRAND_COLORS = {
  forest: "#2F5D43",
  deepForest: "#1F3D2B",
  honey: "#E3A857",
  cream: "#FBF8F1",
} as const;
