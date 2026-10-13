"use client";

import { CircleAlertIcon, CircleCheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
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
import { useValidationMessage } from "./form-fields";
import { useRunAction } from "./run-action";

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

/** `message` is a validation key sent back by the Server Action. */
function FieldError({ message }: { message?: string }) {
  const text = useValidationMessage()(message);
  return text ? <p className="text-sm font-bold text-danger">{text}</p> : null;
}

export function LoginForm() {
  const t = useTranslations("Admin.Auth");
  const runAction = useRunAction();
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
        <Notice tone="success">{t("passwordChanged")}</Notice>
      ) : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">{t("email")}</Label>
        <Input id="email" name="email" type="email" autoComplete="username" required className="h-11" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">{t("password")}</Label>
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
        {pending ? t("signingIn") : t("signIn")}
      </Button>
      <Link
        href="/admin/forgot-password"
        className="self-center text-sm font-bold text-forest-700 underline underline-offset-4"
      >
        {t("forgotLink")}
      </Link>
    </form>
  );
}

export function ForgotPasswordForm() {
  const t = useTranslations("Admin.Auth");
  const runAction = useRunAction();
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
          {t("resetSent")}
        </Notice>
        <Link
          href="/admin/login"
          className="self-center text-sm font-bold text-forest-700 underline underline-offset-4"
        >
          {t("backToSignIn")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">{t("email")}</Label>
        <Input id="email" name="email" type="email" autoComplete="username" required className="h-11" />
      </div>
      <Button type="submit" size="lg" className="h-11" disabled={pending}>
        {pending ? t("sending") : t("emailLink")}
      </Button>
      <Link
        href="/admin/login"
        className="self-center text-sm font-bold text-forest-700 underline underline-offset-4"
      >
        {t("backToSignIn")}
      </Link>
    </form>
  );
}

export function ResetPasswordForm() {
  const t = useTranslations("Admin.Auth");
  const tCommon = useTranslations("Admin.Common");
  const runAction = useRunAction();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(
    searchParams.get("error") ? t("linkExpired") : null,
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
          {error ?? t("linkInvalid")}
        </Notice>
        <Link
          href="/admin/forgot-password"
          className="self-center text-sm font-bold text-forest-700 underline underline-offset-4"
        >
          {t("requestNewLink")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">{t("newPassword")}</Label>
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
          {t("passwordHelp")}
        </p>
        <FieldError message={fieldErrors.password} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirm">{t("repeatPassword")}</Label>
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
        {pending ? tCommon("saving") : t("saveNewPassword")}
      </Button>
    </form>
  );
}
