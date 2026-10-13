import type { Metadata } from "next";
import { SettingsForm } from "@/components/admin/settings-form";
import { PageHeader } from "@/components/admin/ui";
import { formatPhone } from "@/lib/phone";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Settings" };

// Admin pages wait on the session by design (see the dashboard layout).
export const instant = false;

export default async function SettingsPage() {
  await requireAdmin();
  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });

  return (
    <>
      <PageHeader
        title="Settings"
        description="Contact details and wording used across the website."
      />
      <SettingsForm
        initial={{
          businessName: settings?.businessName ?? "Mabel Home Help",
          taglineEn: settings?.taglineEn ?? "",
          taglineFr: settings?.taglineFr ?? "",
          phone: settings?.phone ? formatPhone(settings.phone) : "",
          email: settings?.email ?? "",
          location: settings?.location ?? "",
          serviceAreasEn: settings?.serviceAreasEn ?? [],
          serviceAreasFr: settings?.serviceAreasFr ?? [],
          hoursEn: settings?.hoursEn ?? "",
          hoursFr: settings?.hoursFr ?? "",
          disclaimerEn: settings?.disclaimerEn ?? "",
          disclaimerFr: settings?.disclaimerFr ?? "",
          notificationEmails: settings?.notificationEmails ?? [],
        }}
      />
    </>
  );
}
