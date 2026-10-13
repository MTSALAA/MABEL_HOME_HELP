import type { Metadata } from "next";
import { ServiceForm } from "@/components/admin/service-form";
import { PageHeader } from "@/components/admin/ui";
import { SERVICE_ILLUSTRATIONS } from "@/lib/constants";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Add a service" };

// Admin pages wait on the session by design (see the dashboard layout).
export const instant = false;

export default async function NewServicePage() {
  await requireAdmin();

  return (
    <>
      <PageHeader title="Add a service" backHref="/admin/services" backLabel="All services" />
      <ServiceForm
        id={null}
        initial={{
          titleEn: "",
          titleFr: "",
          descriptionEn: "",
          descriptionFr: "",
          slug: "",
          illustration: SERVICE_ILLUSTRATIONS[0],
          imageUrl: "",
          isActive: true,
          isFeatured: false,
        }}
      />
    </>
  );
}
