"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { Link } from "@/i18n/navigation";
import type { SponsorInput } from "@/lib/validation/public";
import { submitSponsor } from "@/server/actions/public";
import {
  Choice,
  ChoiceGroup,
  ConsentField,
  controlClass,
  Field,
  focusFirstInvalid,
  lazySchemaResolver,
  preloadValidation,
  ServerError,
  SubmitButton,
  SuccessPanel,
  useFormMeta,
  useSubmission,
} from "./form-kit";

const EMPTY: SponsorInput = {
  fullName: "",
  phone: "",
  email: "",
  organization: "",
  intent: "SPONSOR_VISITS",
  message: "",
  consent: false,
};

// Zod and the schema load when the form is first used, not with the page.
const resolver = lazySchemaResolver<SponsorInput>("sponsorSchema");

export function SponsorForm() {
  const t = useTranslations("Forms");
  const tSponsor = useTranslations("Sponsor");
  const { metaFields, getMeta, resetMeta } = useFormMeta();
  const state = useSubmission();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SponsorInput>({
    // No default values: fields keep anything typed before this script loaded.
    resolver,
    // Focus after a failed submit is handled by focusFirstInvalid.
    shouldFocusError: false,
  });

  const onSubmit = handleSubmit(async (values) => {
    const sent = await state.submit(() => submitSponsor(values, getMeta()));
    resetMeta();
    if (sent) state.finish();
  }, focusFirstInvalid);

  if (state.done) {
    return (
      <SuccessPanel
        title={tSponsor("successTitle")}
        body={tSponsor("successBody")}
      >
        <button
          type="button"
          onClick={() => {
            reset(EMPTY);
            state.restart();
          }}
          className="min-h-11 rounded-lg text-lg font-bold text-forest-700 underline underline-offset-4"
        >
          {tSponsor("another")}
        </button>
      </SuccessPanel>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      onFocus={preloadValidation}
      noValidate
      className="relative flex flex-col gap-6"
    >
      <Field label={t("fullName")} error={errors.fullName}>
        {(props) => (
          <input
            {...props}
            {...register("fullName")}
            type="text"
            autoComplete="name"
            className={controlClass}
          />
        )}
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={t("email")} error={errors.email}>
          {(props) => (
            <input
              {...props}
              {...register("email")}
              type="email"
              inputMode="email"
              autoComplete="email"
              className={controlClass}
            />
          )}
        </Field>
        <Field label={t("phone")} optional error={errors.phone}>
          {(props) => (
            <input
              {...props}
              {...register("phone")}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              className={controlClass}
            />
          )}
        </Field>
      </div>

      <Field
        label={tSponsor("organization")}
        optional
        error={errors.organization}
      >
        {(props) => (
          <input
            {...props}
            {...register("organization")}
            type="text"
            autoComplete="organization"
            className={controlClass}
          />
        )}
      </Field>

      <ChoiceGroup
        legend={tSponsor("intentLabel")}
        error={errors.intent}
        columns={1}
      >
        {(["SPONSOR_VISITS", "NOMINATE_SENIOR", "OTHER"] as const).map((intent) => (
          <Choice
            key={intent}
            label={tSponsor(`intent.${intent}`)}
            value={intent}
            defaultChecked={intent === EMPTY.intent}
            {...register("intent")}
          />
        ))}
      </ChoiceGroup>

      <Field
        label={tSponsor("messageLabel")}
        optional
        help={t("messageHelp")}
        error={errors.message}
      >
        {(props) => (
          <textarea
            {...props}
            {...register("message")}
            rows={4}
            className={`${controlClass} py-3`}
          />
        )}
      </Field>

      <ConsentField error={errors.consent} {...register("consent")}>
        {t.rich("consent", {
          privacy: (chunks) => (
            <Link href="/privacy" target="_blank">
              {chunks}
            </Link>
          ),
        })}
      </ConsentField>

      {metaFields}
      <ServerError error={state.serverError} />
      <div>
        <SubmitButton pending={state.pending}>{t("submitMessage")}</SubmitButton>
      </div>
    </form>
  );
}
