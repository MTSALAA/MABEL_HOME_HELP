"use client";

import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { inviteUser, setUserActive } from "@/server/actions/admin/users";
import { ConfirmAction } from "./detail-controls";
import { FormError, TextField } from "./form-fields";
import { runAction } from "./run-action";

export function InviteUserForm() {
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
        toast.success(
          "Invitation sent. If the email doesn't arrive, they can use “Forgot your password?” on the sign-in page.",
          { duration: 8000 },
        );
        formElement.reset();
      } else {
        setFormError(result.fieldErrors ? null : result.error);
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <TextField label="Name" name="name" autoComplete="off" error={fieldErrors.name} />
      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="off"
        error={fieldErrors.email}
      />
      <FormError message={formError} />
      <Button type="submit" className="self-start" disabled={pending}>
        {pending ? "Sending…" : "Send invitation"}
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
  const [pending, startTransition] = useTransition();

  if (isSelf) {
    return <span className="text-sm text-muted-foreground">This is you</span>;
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
            if (result.ok) toast.success(`${name} can sign in again.`);
            else toast.error(result.error);
          })
        }
      >
        Reactivate
      </Button>
    );
  }

  return (
    <ConfirmAction
      trigger={
        <Button variant="outline" size="sm">
          Deactivate
        </Button>
      }
      title={`Deactivate ${name}?`}
      description="They are signed out immediately and can no longer sign in. You can reactivate them later."
      confirmLabel="Deactivate"
      successMessage={`${name} was deactivated.`}
      action={() => setUserActive(userId, false)}
    />
  );
}
