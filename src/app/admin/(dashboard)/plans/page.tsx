import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { SortableList } from "@/components/admin/sortable-list";
import { PageHeader } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { pick } from "@/lib/localize";
import { reorderPlans, setPlanFlag } from "@/server/actions/admin/content";
import { getAdminLocale, getAdminT } from "@/server/admin-i18n";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/session";
import { isStripeEnabled } from "@/server/stripe";

export async function generateMetadata() {
  const t = await getAdminT("Nav");
  return { title: t("plans") };
}

// Admin pages wait on the session by design (see the dashboard layout).
export const instant = false;

export default async function PlansAdminPage() {
  await requireAdmin();
  const [plans, locale, t] = await Promise.all([
    prisma.plan.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        _count: { select: { memberships: { where: { status: "ACTIVE" } } } },
      },
    }),
    getAdminLocale(),
    getAdminT("Plans"),
  ]);
  const stripeEnabled = isStripeEnabled();

  return (
    <>
      <PageHeader title={t("title")} description={t("description")}>
        <Button asChild>
          <Link href="/admin/plans/new">
            <PlusIcon aria-hidden="true" />
            {t("add")}
          </Link>
        </Button>
      </PageHeader>
      <SortableList
        emptyMessage={t("empty")}
        reorderAction={reorderPlans}
        flagAction={setPlanFlag}
        items={plans.map((plan) => {
          const badges: string[] = [];
          if (plan.isPurchasable) {
            badges.push(
              !stripeEnabled
                ? t("badges.stripeNotConnected")
                : plan.stripePriceId
                  ? t("badges.buyOnline")
                  : t("badges.needsSaving"),
            );
          }
          if (plan._count.memberships > 0) {
            badges.push(t("badges.activeMembers", { count: plan._count.memberships }));
          }
          return {
            id: plan.id,
            title: pick(locale, plan.nameEn, plan.nameFr),
            subtitle: `${pick(locale, plan.priceTextEn, plan.priceTextFr)} · ${pick(locale, plan.includesEn, plan.includesFr)}`,
            editHref: `/admin/plans/${plan.id}`,
            badges,
            flags: [
              { key: "isActive", label: t("shown"), value: plan.isActive },
              { key: "isHighlighted", label: t("mostPopular"), value: plan.isHighlighted },
            ],
          };
        })}
      />
    </>
  );
}
