import { ServiceForm } from "@/components/admin/service-form";
import { PageHeader } from "@/components/admin/ui";
import { SERVICE_ILLUSTRATIONS } from "@/lib/constants";
import { getAdminT } from "@/server/admin-i18n";
import { requireAdmin } from "@/server/session";

export async function generateMetadata() {
  const t = await getAdminT("Services");
  return { title: t("add") };
}

// Admin pages wait on the session by design (see the dashboard layout).
export const instant = false;

export default async function NewServicePage() {
  await requireAdmin();
  const t = await getAdminT("Services");

  return (
    <>
      <PageHeader title={t("add")} backHref="/admin/services" backLabel={t("all")} />
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
