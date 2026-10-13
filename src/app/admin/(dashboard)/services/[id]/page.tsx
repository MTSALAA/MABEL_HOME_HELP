import { notFound } from "next/navigation";
import { ServiceForm } from "@/components/admin/service-form";
import { PageHeader } from "@/components/admin/ui";
import { SERVICE_ILLUSTRATIONS, type ServiceIllustration } from "@/lib/constants";
import { pick } from "@/lib/localize";
import { getAdminLocale, getAdminT } from "@/server/admin-i18n";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/session";

export async function generateMetadata() {
  const t = await getAdminT("Services");
  return { title: t("editTitle") };
}

// Admin pages wait on the session by design (see the dashboard layout).
export const instant = false;

export default async function EditServicePage({
  params,
}: PageProps<"/admin/services/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) notFound();
  const [locale, t] = await Promise.all([getAdminLocale(), getAdminT("Services")]);

  const illustration = (SERVICE_ILLUSTRATIONS as readonly string[]).includes(
    service.illustration,
  )
    ? (service.illustration as ServiceIllustration)
    : SERVICE_ILLUSTRATIONS[0];

  return (
    <>
      <PageHeader
        title={pick(locale, service.titleEn, service.titleFr)}
        description={t("editDescription")}
        backHref="/admin/services"
        backLabel={t("all")}
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
