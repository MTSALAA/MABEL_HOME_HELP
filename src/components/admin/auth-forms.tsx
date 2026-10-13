"use client";

import { CircleAlertIcon, CircleCheckIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  requestPasswordResetAction,
  resetPasswordAction,
  signInAction,
} from "@/server/actions/auth";
import { runAction } from "./run-action";

function Notice({ tone, children }: { tone: "error" | "success"; children: ReactNode }) {
  const Icon = tone === "error" ? CircleAlertIcon : CircleCheckIcon;
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={
        tone === "error"
          ? "flex items-start gap-2 rounded-lg border border-danger bg-danger-soft p-3 text-sm font-bold text-danger"
          : "flex items-start gap-2 rounded-lg border border-forest-300 bg-forest-50 p-3 text-sm font-bold text-forest-900"
      }
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-sm font-bold text-danger">{message}</p> : null;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await runAction(() => signInAction({
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
      }));
      if (!result.ok) {
        setError(result.error);
        return;
      }
      // Only ever return to a page inside the admin.
      const next = searchParams.get("next");
      router.replace(next && /^\/admin(\/|$)/.test(next) ? next : "/admin");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {searchParams.get("reset") === "1" ? (
        <Notice tone="success">Your password was changed. Sign in with the new one.</Notice>
      ) : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="username" required className="h-11" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-11"
        />
      </div>
      <Button type="submit" size="lg" className="h-11" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <Link
        href="/admin/forgot-password"
        className="self-center text-sm font-bold text-forest-700 underline underline-offset-4"
      >
        Forgot your password?
      </Link>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await runAction(() => requestPasswordResetAction({
        email: String(form.get("email") ?? ""),
      }));
      if (result.ok) setSent(true);
      else setError(result.error);
    });
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-4">
        <Notice tone="success">
          If that email belongs to an admin, a reset link is on its way. It works for one hour.
        </Notice>
        <Link
          href="/admin/login"
          className="self-center text-sm font-bold text-forest-700 underline underline-offset-4"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="username" required className="h-11" />
      </div>
      <Button type="submit" size="lg" className="h-11" disabled={pending}>
        {pending ? "Sending…" : "Email me a reset link"}
      </Button>
      <Link
        href="/admin/login"
        className="self-center text-sm font-bold text-forest-700 underline underline-offset-4"
      >
        Back to sign in
      </Link>
    </form>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(
    searchParams.get("error") ? "This link has expired or was already used." : null,
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const result = await runAction(() => resetPasswordAction({
        token,
        password: String(form.get("password") ?? ""),
        confirm: String(form.get("confirm") ?? ""),
      }));
      if (result.ok) {
        router.replace("/admin/login?reset=1");
      } else {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  }

  if (!token) {
    return (
      <div className="flex flex-col gap-4">
        <Notice tone="error">
          {error ?? "This link is not valid. Request a new one."}
        </Notice>
        <Link
          href="/admin/forgot-password"
          className="self-center text-sm font-bold text-forest-700 underline underline-offset-4"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          aria-describedby="password-help"
          className="h-11"
        />
        <p id="password-help" className="text-sm text-muted-foreground">
          At least 10 characters.
        </p>
        <FieldError message={fieldErrors.password} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirm">Repeat the new password</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          className="h-11"
        />
        <FieldError message={fieldErrors.confirm} />
      </div>
      <Button type="submit" size="lg" className="h-11" disabled={pending}>
        {pending ? "Saving…" : "Save new password"}
      </Button>
    </form>
  );
}
