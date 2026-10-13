import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/components/admin/auth-card";
import { ResetPasswordForm } from "@/components/admin/auth-forms";

export const metadata: Metadata = { title: "Choose a password" };

export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="Choose a password"
      description="Pick a password you don't use anywhere else."
    >
      {/* The form reads the one-time token from the URL. */}
      <Suspense fallback={<div className="h-56" aria-busy="true" />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
