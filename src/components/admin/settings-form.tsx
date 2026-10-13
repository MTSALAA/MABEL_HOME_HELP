"use client";

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
} from "./form-fields";
import { Panel } from "./ui";
import { runAction } from "./run-action";

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
      toast.success("Settings saved. The website is updated.");
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-2">
      <Panel
        title="Contact details"
        description="Shown in the header, footer and contact page of the website."
      >
        <div className="flex flex-col gap-4">
          <TextField
            label="Business name"
            error={errors.businessName?.message}
            defaultValue={defaults.businessName}
            {...register("businessName")}
          />
          <TextField
            label="Phone number"
            type="tel"
            inputMode="tel"
            placeholder="(780) 555-0123"
            help="Powers the Call Now and Text Us buttons. Leave empty to hide them."
            error={errors.phone?.message}
            defaultValue={defaults.phone}
            {...register("phone")}
          />
          <TextField
            label="Business email"
            type="email"
            placeholder="hello@example.com"
            help="Shown on the website and used as the reply address for emails to visitors."
            error={errors.email?.message}
            defaultValue={defaults.email}
            {...register("email")}
          />
          <TextField
            label="Location"
            help="For example “Edmonton, Alberta, Canada”."
            error={errors.location?.message}
            defaultValue={defaults.location}
            {...register("location")}
          />
        </div>
      </Panel>

      <Panel
        title="Notifications"
        description="Who gets an email when a request, sponsor inquiry or membership comes in."
      >
        <TextAreaField
          label="Notification emails"
          rows={4}
          placeholder={"owner@example.com\nassistant@example.com"}
          help="One per line. If empty, notifications go to the business email."
          error={errors.notificationEmails?.message}
          defaultValue={defaults.notificationEmails}
          {...register("notificationEmails")}
        />
      </Panel>

      <Panel
        title="Text in both languages"
        description="Tagline, service areas, hours and the scope disclaimer."
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
                label="Tagline"
                error={errors.taglineEn?.message}
                defaultValue={defaults.taglineEn}
                {...register("taglineEn")}
              />
              <TextField
                label="Hours (optional)"
                placeholder="Monday to Friday, 9 am to 5 pm"
                error={errors.hoursEn?.message}
                defaultValue={defaults.hoursEn}
                {...register("hoursEn")}
              />
              <TextAreaField
                label="Service areas"
                rows={6}
                help="One per line, in the order they should appear. These are also the choices in the booking form."
                error={errors.serviceAreasEn?.message}
                defaultValue={defaults.serviceAreasEn}
                {...register("serviceAreasEn")}
              />
              <TextAreaField
                label="Scope disclaimer"
                rows={6}
                help="Shown on every page."
                error={errors.disclaimerEn?.message}
                defaultValue={defaults.disclaimerEn}
                {...register("disclaimerEn")}
              />
            </div>
          }
          french={
            <div className="grid gap-4 lg:grid-cols-2">
              <TextField
                label="Slogan"
                lang="fr"
                error={errors.taglineFr?.message}
                defaultValue={defaults.taglineFr}
                {...register("taglineFr")}
              />
              <TextField
                label="Heures (facultatif)"
                lang="fr"
                error={errors.hoursFr?.message}
                defaultValue={defaults.hoursFr}
                {...register("hoursFr")}
              />
              <TextAreaField
                label="Secteurs desservis"
                lang="fr"
                rows={6}
                help="One per line, in the same order and the same number as the English list."
                error={errors.serviceAreasFr?.message}
                defaultValue={defaults.serviceAreasFr}
                {...register("serviceAreasFr")}
              />
              <TextAreaField
                label="Avis sur la portée des services"
                lang="fr"
                rows={6}
                error={errors.disclaimerFr?.message}
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
            {pending ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </div>
    </form>
  );
}
