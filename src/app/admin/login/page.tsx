import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/components/admin/auth-card";
import { LoginForm } from "@/components/admin/auth-forms";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthCard title="Sign in" description="Mabel Home Help admin dashboard.">
      {/* The form reads ?next= from the URL. */}
      <Suspense fallback={<div className="h-64" aria-busy="true" />}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
