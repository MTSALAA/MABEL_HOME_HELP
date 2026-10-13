import type { Metadata } from "next";
import { PlanForm } from "@/components/admin/plan-form";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/server/session";
import { isStripeEnabled } from "@/server/stripe";

export const metadata: Metadata = { title: "Add a plan" };

// Admin pages wait on the session by design (see the dashboard layout).
export const instant = false;

export default async function NewPlanPage() {
  await requireAdmin();

  return (
    <>
      <PageHeader title="Add a plan" backHref="/admin/plans" backLabel="All plans" />
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
