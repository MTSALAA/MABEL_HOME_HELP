import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { SortableList } from "@/components/admin/sortable-list";
import { PageHeader } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { pick } from "@/lib/localize";
import { reorderServices, setServiceFlag } from "@/server/actions/admin/content";
import { getAdminLocale, getAdminT } from "@/server/admin-i18n";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/session";

export async function generateMetadata() {
  const t = await getAdminT("Nav");
  return { title: t("services") };
}

// Admin pages wait on the session by design (see the dashboard layout).
export const instant = false;

export default async function ServicesAdminPage() {
  await requireAdmin();
  const [services, locale, t] = await Promise.all([
    prisma.service.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    getAdminLocale(),
    getAdminT("Services"),
  ]);

  return (
    <>
      <PageHeader title={t("title")} description={t("description")}>
        <Button asChild>
          <Link href="/admin/services/new">
            <PlusIcon aria-hidden="true" />
            {t("add")}
          </Link>
        </Button>
      </PageHeader>
      <SortableList
        emptyMessage={t("empty")}
        reorderAction={reorderServices}
        flagAction={setServiceFlag}
        items={services.map((service) => ({
          id: service.id,
          title: pick(locale, service.titleEn, service.titleFr),
          subtitle: pick(locale, service.descriptionEn, service.descriptionFr),
          editHref: `/admin/services/${service.id}`,
          thumbnail: service.imageUrl ?? `/illustrations/${service.illustration}.svg`,
          badges: service.titleFr ? undefined : [t("noFrenchTitle")],
          flags: [
            { key: "isActive", label: t("shown"), value: service.isActive },
            { key: "isFeatured", label: t("featured"), value: service.isFeatured },
          ],
        }))}
      />
    </>
  );
}
