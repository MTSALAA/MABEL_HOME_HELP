import { SettingsForm } from "@/components/admin/settings-form";
import { PageHeader } from "@/components/admin/ui";
import { formatPhone } from "@/lib/phone";
import { getAdminT } from "@/server/admin-i18n";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/session";

export async function generateMetadata() {
  const t = await getAdminT("Nav");
  return { title: t("settings") };
}

// Admin pages wait on the session by design (see the dashboard layout).
export const instant = false;

export default async function SettingsPage() {
  await requireAdmin();
  const [settings, t] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: 1 } }),
    getAdminT("Settings"),
  ]);

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
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
          staffLocale: settings?.staffLocale ?? "EN",
        }}
      />
    </>
  );
}
