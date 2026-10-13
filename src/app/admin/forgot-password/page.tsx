import { AuthCard } from "@/components/admin/auth-card";
import { ForgotPasswordForm } from "@/components/admin/auth-forms";
import { getAdminT } from "@/server/admin-i18n";

export async function generateMetadata() {
  const t = await getAdminT("Auth");
  return { title: t("forgot.title") };
}

export default function ForgotPasswordPage() {
  return (
    <AuthCard screen="forgot">
      <ForgotPasswordForm />
    </AuthCard>
  );
}
