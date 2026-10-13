import { Suspense } from "react";
import { AuthCard } from "@/components/admin/auth-card";
import { LoginForm } from "@/components/admin/auth-forms";
import { getAdminT } from "@/server/admin-i18n";

export async function generateMetadata() {
  const t = await getAdminT("Auth");
  return { title: t("login.title") };
}

export default function LoginPage() {
  return (
    <AuthCard screen="login">
      {/* The form reads ?next= from the URL. */}
      <Suspense fallback={<div className="h-64" aria-busy="true" />}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
