import { Suspense } from "react";
import { AuthCard } from "@/components/admin/auth-card";
import { ResetPasswordForm } from "@/components/admin/auth-forms";
import { getAdminT } from "@/server/admin-i18n";

export async function generateMetadata() {
  const t = await getAdminT("Auth");
  return { title: t("reset.title") };
}

export default function ResetPasswordPage() {
  return (
    <AuthCard screen="reset">
      {/* The form reads the one-time token from the URL. */}
      <Suspense fallback={<div className="h-56" aria-busy="true" />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
