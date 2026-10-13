import { notFound } from "next/navigation";
import { PlanForm } from "@/components/admin/plan-form";
import { PageHeader } from "@/components/admin/ui";
import { pick } from "@/lib/localize";
import { getAdminLocale, getAdminT } from "@/server/admin-i18n";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/session";
import { isStripeEnabled } from "@/server/stripe";

export async function generateMetadata() {
  const t = await getAdminT("Plans");
  return { title: t("editTitle") };
}

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
  const [locale, t] = await Promise.all([getAdminLocale(), getAdminT("Plans")]);

  return (
    <>
      <PageHeader
        title={pick(locale, plan.nameEn, plan.nameFr)}
        description={t("editDescription")}
        backHref="/admin/plans"
        backLabel={t("all")}
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
