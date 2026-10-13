import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SortableList } from "@/components/admin/sortable-list";
import { PageHeader } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { reorderServices, setServiceFlag } from "@/server/actions/admin/content";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Services" };

// Admin pages wait on the session by design (see the dashboard layout).
export const instant = false;

export default async function ServicesAdminPage() {
  await requireAdmin();
  const services = await prisma.service.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return (
    <>
      <PageHeader
        title="Services"
        description="Drag to change the order on the website. Changes are live as soon as you make them."
      >
        <Button asChild>
          <Link href="/admin/services/new">
            <PlusIcon aria-hidden="true" />
            Add a service
          </Link>
        </Button>
      </PageHeader>
      <SortableList
        emptyMessage="No services yet. Add the first one."
        reorderAction={reorderServices}
        flagAction={setServiceFlag}
        items={services.map((service) => ({
          id: service.id,
          title: service.titleEn,
          subtitle: service.descriptionEn,
          editHref: `/admin/services/${service.id}`,
          thumbnail: service.imageUrl ?? `/illustrations/${service.illustration}.svg`,
          badges: service.titleFr ? undefined : ["No French title"],
          flags: [
            { key: "isActive", label: "Shown", value: service.isActive },
            { key: "isFeatured", label: "Featured", value: service.isFeatured },
          ],
        }))}
      />
    </>
  );
}
