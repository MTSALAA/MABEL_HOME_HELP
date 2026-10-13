import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceForm } from "@/components/admin/service-form";
import { PageHeader } from "@/components/admin/ui";
import { SERVICE_ILLUSTRATIONS, type ServiceIllustration } from "@/lib/constants";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Edit service" };

// Admin pages wait on the session by design (see the dashboard layout).
export const instant = false;

export default async function EditServicePage({
  params,
}: PageProps<"/admin/services/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) notFound();

  const illustration = (SERVICE_ILLUSTRATIONS as readonly string[]).includes(
    service.illustration,
  )
    ? (service.illustration as ServiceIllustration)
    : SERVICE_ILLUSTRATIONS[0];

  return (
    <>
      <PageHeader
        title={service.titleEn}
        description="Edit this service."
        backHref="/admin/services"
        backLabel="All services"
      />
      <ServiceForm
        id={service.id}
        initial={{
          titleEn: service.titleEn,
          titleFr: service.titleFr ?? "",
          descriptionEn: service.descriptionEn,
          descriptionFr: service.descriptionFr ?? "",
          slug: service.slug,
          illustration,
          imageUrl: service.imageUrl ?? "",
          isActive: service.isActive,
          isFeatured: service.isFeatured,
        }}
      />
    </>
  );
}
