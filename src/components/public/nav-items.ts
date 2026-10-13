// Shared by the header (client) and footer (server), so it lives outside any
// "use client" module.
export const NAV_ITEMS = [
  { href: "/services", key: "services" },
  { href: "/pricing", key: "pricing" },
  { href: "/about", key: "about" },
  { href: "/sponsor-a-senior", key: "sponsor" },
  { href: "/contact", key: "contact" },
] as const;
