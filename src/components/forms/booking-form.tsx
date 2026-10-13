"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link } from "@/i18n/navigation";
import { OTHER_AREA, UNSURE } from "@/lib/validation/constants";
import type { BookingInput } from "@/lib/validation/public";
import { submitBooking } from "@/server/actions/public";
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

export type BookingOptions = {
  services: { id: string; slug: string; title: string }[];
  plans: { id: string; slug: string; name: string }[];
  areas: { value: string; label: string }[];
};

const EMPTY: BookingInput = {
  fullName: "",
  phone: "",
  email: "",
  requesterRole: "SELF",
  serviceId: "",
  planId: "",
  area: "",
  contactMethod: "CALL",
  preferredTime: "",
  message: "",
  consent: false,
};

// Zod and the schema load when the form is first used, not with the page.
const resolver = lazySchemaResolver<BookingInput>("bookingSchema");

export function BookingForm({ services, plans, areas }: BookingOptions) {
  const t = useTranslations("Forms");
  const tBook = useTranslations("Book");
  const tCommon = useTranslations("Common");
  const { metaFields, getMeta, resetMeta } = useFormMeta();
  const state = useSubmission();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<BookingInput>({
    // No default values on purpose: each field keeps what is already in the
    // page (including anything typed before this script loaded).
    resolver,
    // Focus after a failed submit is handled by focusFirstInvalid.
    shouldFocusError: false,
  });

  // "Request this service" and "Request this plan" links pre-select the field.
  // The URL is read after mount so the page itself stays fully static.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const service = services.find((item) => item.slug === params.get("service"));
    const plan = plans.find((item) => item.slug === params.get("plan"));
    if (service) setValue("serviceId", service.id);
    if (plan) {
      setValue("planId", plan.id);
      if (!service) setValue("serviceId", UNSURE);
    }
  }, [services, plans, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    const sent = await state.submit(() => submitBooking(values, getMeta()));
    resetMeta();
    if (sent) state.finish();
  }, focusFirstInvalid);

  if (state.done) {
    return (
      <SuccessPanel title={tBook("successTitle")} body={tBook("successBody")}>
        <button
          type="button"
          onClick={() => {
            reset(EMPTY);
            state.restart();
          }}
          className="min-h-11 rounded-lg text-lg font-bold text-forest-700 underline underline-offset-4"
        >
          {tBook("another")}
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
        <Field label={t("phone")} error={errors.phone}>
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
        <Field label={t("email")} optional error={errors.email}>
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
      </div>

      <ChoiceGroup legend={t("requesterRole")} error={errors.requesterRole}>
        {(["SELF", "FAMILY", "OTHER"] as const).map((role) => (
          <Choice
            key={role}
            label={t(`role.${role}`)}
            value={role}
            defaultChecked={role === EMPTY.requesterRole}
            {...register("requesterRole")}
          />
        ))}
      </ChoiceGroup>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={t("service")} error={errors.serviceId}>
          {(props) => (
            <select
              {...props}
              {...register("serviceId")}
              defaultValue=""
              className={controlClass}
            >
              <option value="" disabled>
                {t("servicePlaceholder")}
              </option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.title}
                </option>
              ))}
              <option value={UNSURE}>{tCommon("notSure")}</option>
            </select>
          )}
        </Field>
        <Field label={t("plan")} optional error={errors.planId}>
          {(props) => (
            <select
              {...props}
              {...register("planId")}
              defaultValue=""
              className={controlClass}
            >
              <option value="">{t("planPlaceholder")}</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
              <option value={UNSURE}>{tCommon("notSure")}</option>
            </select>
          )}
        </Field>
      </div>

      <Field label={t("area")} error={errors.area}>
        {(props) => (
          <select
            {...props}
            {...register("area")}
            defaultValue=""
            className={controlClass}
          >
            <option value="" disabled>
              {t("areaPlaceholder")}
            </option>
            {areas.map((area) => (
              <option key={area.value} value={area.value}>
                {area.label}
              </option>
            ))}
            <option value={OTHER_AREA}>{tCommon("other")}</option>
          </select>
        )}
      </Field>

      <ChoiceGroup legend={t("contactMethod")} error={errors.contactMethod}>
        {(["CALL", "TEXT", "EMAIL"] as const).map((method) => (
          <Choice
            key={method}
            label={t(`method.${method}`)}
            value={method}
            defaultChecked={method === EMPTY.contactMethod}
            {...register("contactMethod")}
          />
        ))}
      </ChoiceGroup>

      <Field
        label={t("preferredTime")}
        optional
        help={t("preferredTimeHelp")}
        error={errors.preferredTime}
      >
        {(props) => (
          <input
            {...props}
            {...register("preferredTime")}
            type="text"
            className={controlClass}
          />
        )}
      </Field>

      <Field
        label={t("message")}
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
        <SubmitButton pending={state.pending}>{t("submitRequest")}</SubmitButton>
      </div>
    </form>
  );
}
