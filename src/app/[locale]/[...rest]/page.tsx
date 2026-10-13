import { notFound } from "next/navigation";

// This segment only ever renders a 404, so there is no navigation to validate.
export const instant = false;

// Any unknown path under a locale renders the localized not-found page.
export default function CatchAllPage() {
  notFound();
}
