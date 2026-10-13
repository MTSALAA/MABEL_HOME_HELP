"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { inviteUser, setUserActive } from "@/server/actions/admin/users";
import { ConfirmAction } from "./detail-controls";
import { FormError, TextField, useValidationMessage } from "./form-fields";
import { useRunAction } from "./run-action";

export function InviteUserForm() {
  const t = useTranslations("Admin.Users");
  const msg = useValidationMessage();
  const runAction = useRunAction();
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setFormError(null);
    setFieldErrors({});
    startTransition(async () => {
      const result = await runAction(() => inviteUser({
        name: String(form.get("name") ?? ""),
        email: String(form.get("email") ?? ""),
      }));
      if (result.ok) {
        toast.success(t("invitationSent"), { duration: 8000 });
        formElement.reset();
      } else {
        setFormError(result.fieldErrors ? null : result.error);
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <TextField
        label={t("name")}
        name="name"
        autoComplete="off"
        error={msg(fieldErrors.name)}
      />
      <TextField
        label={t("email")}
        name="email"
        type="email"
        autoComplete="off"
        error={msg(fieldErrors.email)}
      />
      <FormError message={formError} />
      <Button type="submit" className="self-start" disabled={pending}>
        {pending ? t("sending") : t("sendInvitation")}
      </Button>
    </form>
  );
}

export function UserActiveButton({
  userId,
  name,
  isActive,
  isSelf,
}: {
  userId: string;
  name: string;
  isActive: boolean;
  isSelf: boolean;
}) {
  const t = useTranslations("Admin.Users");
  const runAction = useRunAction();
  const [pending, startTransition] = useTransition();

  if (isSelf) {
    return <span className="text-sm text-muted-foreground">{t("thisIsYou")}</span>;
  }

  if (!isActive) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await runAction(() => setUserActive(userId, true));
            if (result.ok) toast.success(t("reactivated", { name }));
            else toast.error(result.error);
          })
        }
      >
        {t("reactivate")}
      </Button>
    );
  }

  return (
    <ConfirmAction
      trigger={
        <Button variant="outline" size="sm">
          {t("deactivate")}
        </Button>
      }
      title={t("deactivateTitle", { name })}
      description={t("deactivateDescription")}
      confirmLabel={t("deactivate")}
      successMessage={t("deactivatedToast", { name })}
      action={() => setUserActive(userId, false)}
    />
  );
}
