"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { SettingsInput } from "@/lib/validation/admin";
import { saveSettings } from "@/server/actions/admin/content";
import {
  FormError,
  LanguageTabs,
  TextAreaField,
  TextField,
  useValidationMessage,
} from "./form-fields";
import { Panel } from "./ui";
import { useRunAction } from "./run-action";

// Lists are edited as one item per line, which makes adding, removing and
// reordering as simple as editing text.
type SettingsFormValues = Omit<
  SettingsInput,
  "serviceAreasEn" | "serviceAreasFr" | "notificationEmails"
> & {
  serviceAreasEn: string;
  serviceAreasFr: string;
  notificationEmails: string;
};

function toLines(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function SettingsForm({ initial }: { initial: SettingsInput }) {
  const t = useTranslations("Admin.Settings");
  const tCommon = useTranslations("Admin.Common");
  const msg = useValidationMessage();
  const runAction = useRunAction();
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SettingsFormValues>();

  // Fields take their value from the HTML (defaultValue), so they are filled
  // in before this script loads.
  const defaults: SettingsFormValues = {
    ...initial,
    serviceAreasEn: initial.serviceAreasEn.join("\n"),
    serviceAreasFr: initial.serviceAreasFr.join("\n"),
    notificationEmails: initial.notificationEmails.join("\n"),
  };

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      const result = await runAction(() => saveSettings({
        ...values,
        serviceAreasEn: values.serviceAreasEn.split("\n").map((l) => l.trim()).filter(Boolean),
        serviceAreasFr: values.serviceAreasFr.split("\n").map((l) => l.trim()).filter(Boolean),
        notificationEmails: toLines(values.notificationEmails),
      }));
      if (!result.ok) {
        setFormError(result.error);
        for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
          // Array errors come back as "notificationEmails.1": show on the field.
          const name = field.split(".")[0] as keyof SettingsFormValues;
          setError(name, { message });
        }
        return;
      }
      toast.success(t("saved"));
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-2">
      <Panel
        title={t("contact.title")}
        description={t("contact.description")}
      >
        <div className="flex flex-col gap-4">
          <TextField
            label={t("contact.businessName")}
            error={msg(errors.businessName?.message)}
            defaultValue={defaults.businessName}
            {...register("businessName")}
          />
          <TextField
            label={t("contact.phone")}
            type="tel"
            inputMode="tel"
            placeholder="(780) 555-0123"
            help={t("contact.phoneHelp")}
            error={msg(errors.phone?.message)}
            defaultValue={defaults.phone}
            {...register("phone")}
          />
          <TextField
            label={t("contact.email")}
            type="email"
            placeholder={t("contact.emailPlaceholder")}
            help={t("contact.emailHelp")}
            error={msg(errors.email?.message)}
            defaultValue={defaults.email}
            {...register("email")}
          />
          <TextField
            label={t("contact.location")}
            help={t("contact.locationHelp")}
            error={msg(errors.location?.message)}
            defaultValue={defaults.location}
            {...register("location")}
          />
        </div>
      </Panel>

      <Panel
        title={t("notifications.title")}
        description={t("notifications.description")}
      >
        <TextAreaField
          label={t("notifications.emails")}
          rows={4}
          placeholder={t("notifications.emailsPlaceholder")}
          help={t("notifications.emailsHelp")}
          error={msg(errors.notificationEmails?.message)}
          defaultValue={defaults.notificationEmails}
          {...register("notificationEmails")}
        />
        <div className="mt-4 flex flex-col gap-1.5">
          <label htmlFor="staff-locale" className="text-sm leading-none font-medium">
            {t("notifications.staffLanguage")}
          </label>
          <select
            id="staff-locale"
            aria-describedby="staff-locale-help"
            defaultValue={defaults.staffLocale}
            className="h-10 rounded-md border border-input bg-white px-3 font-bold sm:max-w-xs"
            {...register("staffLocale")}
          >
            <option value="EN">English</option>
            <option value="FR">Français</option>
          </select>
          <p id="staff-locale-help" className="text-sm text-muted-foreground">
            {t("notifications.staffLanguageHelp")}
          </p>
        </div>
      </Panel>

      <Panel
        title={t("text.title")}
        description={t("text.description")}
        className="lg:col-span-2"
      >
        <LanguageTabs
          englishHasError={Boolean(
            errors.taglineEn || errors.serviceAreasEn || errors.hoursEn || errors.disclaimerEn,
          )}
          frenchHasError={Boolean(
            errors.taglineFr || errors.serviceAreasFr || errors.hoursFr || errors.disclaimerFr,
          )}
          english={
            <div className="grid gap-4 lg:grid-cols-2">
              <TextField
                label={t("fields.tagline")}
                error={msg(errors.taglineEn?.message)}
                defaultValue={defaults.taglineEn}
                {...register("taglineEn")}
              />
              <TextField
                label={t("fields.hours")}
                placeholder={t("fields.hoursPlaceholder")}
                error={msg(errors.hoursEn?.message)}
                defaultValue={defaults.hoursEn}
                {...register("hoursEn")}
              />
              <TextAreaField
                label={t("fields.serviceAreas")}
                rows={6}
                help={t("fields.serviceAreasHelp")}
                error={msg(errors.serviceAreasEn?.message)}
                defaultValue={defaults.serviceAreasEn}
                {...register("serviceAreasEn")}
              />
              <TextAreaField
                label={t("fields.disclaimer")}
                rows={6}
                help={t("fields.disclaimerHelp")}
                error={msg(errors.disclaimerEn?.message)}
                defaultValue={defaults.disclaimerEn}
                {...register("disclaimerEn")}
              />
            </div>
          }
          french={
            <div className="grid gap-4 lg:grid-cols-2">
              <TextField
                label={t("french.tagline")}
                lang="fr"
                error={msg(errors.taglineFr?.message)}
                defaultValue={defaults.taglineFr}
                {...register("taglineFr")}
              />
              <TextField
                label={t("french.hours")}
                lang="fr"
                error={msg(errors.hoursFr?.message)}
                defaultValue={defaults.hoursFr}
                {...register("hoursFr")}
              />
              <TextAreaField
                label={t("french.serviceAreas")}
                lang="fr"
                rows={6}
                help={t("french.serviceAreasHelp")}
                error={msg(errors.serviceAreasFr?.message)}
                defaultValue={defaults.serviceAreasFr}
                {...register("serviceAreasFr")}
              />
              <TextAreaField
                label={t("french.disclaimer")}
                lang="fr"
                rows={6}
                error={msg(errors.disclaimerFr?.message)}
                defaultValue={defaults.disclaimerFr}
                {...register("disclaimerFr")}
              />
            </div>
          }
        />
      </Panel>

      <div className="flex flex-col gap-3 lg:col-span-2">
        <FormError message={formError} />
        <div>
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? tCommon("saving") : t("save")}
          </Button>
        </div>
      </div>
    </form>
  );
}
