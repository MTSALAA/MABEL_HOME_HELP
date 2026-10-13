import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SortableList } from "@/components/admin/sortable-list";
import { PageHeader } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { reorderPlans, setPlanFlag } from "@/server/actions/admin/content";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/session";
import { isStripeEnabled } from "@/server/stripe";

export const metadata: Metadata = { title: "Plans & pricing" };

// Admin pages wait on the session by design (see the dashboard layout).
export const instant = false;

export default async function PlansAdminPage() {
  await requireAdmin();
  const plans = await prisma.plan.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      _count: { select: { memberships: { where: { status: "ACTIVE" } } } },
    },
  });
  const stripeEnabled = isStripeEnabled();

  return (
    <>
      <PageHeader
        title="Plans & pricing"
        description="Drag to change the order on the website. Changes are live as soon as you make them."
      >
        <Button asChild>
          <Link href="/admin/plans/new">
            <PlusIcon aria-hidden="true" />
            Add a plan
          </Link>
        </Button>
      </PageHeader>
      <SortableList
        emptyMessage="No plans yet. Add the first one."
        reorderAction={reorderPlans}
        flagAction={setPlanFlag}
        items={plans.map((plan) => {
          const badges: string[] = [];
          if (plan.isPurchasable) {
            badges.push(
              !stripeEnabled
                ? "Buy online: Stripe not connected"
                : plan.stripePriceId
                  ? "Buy online"
                  : "Buy online: needs saving",
            );
          }
          if (plan._count.memberships > 0) {
            badges.push(
              `${plan._count.memberships} active member${plan._count.memberships === 1 ? "" : "s"}`,
            );
          }
          return {
            id: plan.id,
            title: plan.nameEn,
            subtitle: `${plan.priceTextEn} · ${plan.includesEn}`,
            editHref: `/admin/plans/${plan.id}`,
            badges,
            flags: [
              { key: "isActive", label: "Shown", value: plan.isActive },
              { key: "isHighlighted", label: "Most popular", value: plan.isHighlighted },
            ],
          };
        })}
      />
    </>
  );
}
