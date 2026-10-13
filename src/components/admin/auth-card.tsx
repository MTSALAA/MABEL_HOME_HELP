import type { ReactNode } from "react";
import { Logo } from "@/components/public/logo";

/** Centered card used by the sign-in and password pages. */
export function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-cream-100 px-4 py-10">
      <Logo />
      <div className="mt-8 w-full max-w-sm rounded-2xl border border-cream-300 bg-white p-7 shadow-soft">
        <h1 className="text-2xl font-bold text-forest-900">{title}</h1>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">{description}</p>
        {children}
      </div>
    </main>
  );
}
