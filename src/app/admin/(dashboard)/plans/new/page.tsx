import { PlanForm } from "@/components/admin/plan-form";
import { PageHeader } from "@/components/admin/ui";
import { getAdminT } from "@/server/admin-i18n";
import { requireAdmin } from "@/server/session";
import { isStripeEnabled } from "@/server/stripe";

export async function generateMetadata() {
  const t = await getAdminT("Plans");
  return { title: t("add") };
}

// Admin pages wait on the session by design (see the dashboard layout).
export const instant = false;

export default async function NewPlanPage() {
  await requireAdmin();
  const t = await getAdminT("Plans");

  return (
    <>
      <PageHeader title={t("add")} backHref="/admin/plans" backLabel={t("all")} />
      <PlanForm
        id={null}
        stripeEnabled={isStripeEnabled()}
        hasStripePrice={false}
        activeMembers={0}
        initial={{
          nameEn: "",
          nameFr: "",
          priceTextEn: "",
          priceTextFr: "",
          includesEn: "",
          includesFr: "",
          noteEn: "",
          noteFr: "",
          slug: "",
          isActive: true,
          isHighlighted: false,
          isPurchasable: false,
          monthlyAmount: "",
        }}
      />
    </>
  );
}
