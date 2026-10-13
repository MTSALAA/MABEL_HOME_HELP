import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlanForm } from "@/components/admin/plan-form";
import { PageHeader } from "@/components/admin/ui";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/session";
import { isStripeEnabled } from "@/server/stripe";

export const metadata: Metadata = { title: "Edit plan" };

// Admin pages wait on the session by design (see the dashboard layout).
export const instant = false;

export default async function EditPlanPage({
  params,
}: PageProps<"/admin/plans/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const plan = await prisma.plan.findUnique({
    where: { id },
    include: {
      _count: { select: { memberships: { where: { status: "ACTIVE" } } } },
    },
  });
  if (!plan) notFound();

  return (
    <>
      <PageHeader
        title={plan.nameEn}
        description="Edit this plan."
        backHref="/admin/plans"
        backLabel="All plans"
      />
      <PlanForm
        id={plan.id}
        stripeEnabled={isStripeEnabled()}
        hasStripePrice={Boolean(plan.stripePriceId)}
        activeMembers={plan._count.memberships}
        initial={{
          nameEn: plan.nameEn,
          nameFr: plan.nameFr ?? "",
          priceTextEn: plan.priceTextEn,
          priceTextFr: plan.priceTextFr ?? "",
          includesEn: plan.includesEn,
          includesFr: plan.includesFr ?? "",
          noteEn: plan.noteEn ?? "",
          noteFr: plan.noteFr ?? "",
          slug: plan.slug,
          isActive: plan.isActive,
          isHighlighted: plan.isHighlighted,
          isPurchasable: plan.isPurchasable,
          monthlyAmount:
            plan.monthlyCents !== null ? (plan.monthlyCents / 100).toFixed(2) : "",
        }}
      />
    </>
  );
}
