import type { Metadata, Viewport } from "next";
import { bodyFont, headingFont } from "@/app/fonts";
import { Toaster } from "@/components/ui/sonner";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Mabel admin" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#1f3d2b",
  width: "device-width",
  initialScale: 1,
};

// The admin sits outside the [locale] segment, so it has its own root layout.
// Its language is a per-browser preference: <AdminIntl> provides it inside
// each screen, because this layout is part of the static shell.
export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="en" className={`${headingFont.variable} ${bodyFont.variable}`}>
      <body className="min-h-dvh bg-cream-50 text-base text-ink">
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
