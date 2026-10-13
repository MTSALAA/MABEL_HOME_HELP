"use client";

import { LockIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { ButtonLink } from "@/components/public/button-link";
import { Link } from "@/i18n/navigation";
import { OTHER_AREA } from "@/lib/validation/constants";
import type { MembershipInput } from "@/lib/validation/public";
import { startMembership } from "@/server/actions/public";
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
  useFormMeta,
  useSubmission,
} from "./form-kit";

function GroupTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="border-b-2 border-cream-300 pb-2 text-2xl font-bold text-forest-900">
      {children}
    </h2>
  );
}

// Zod and the schema load when the form is first used, not with the page.
const resolver = lazySchemaResolver<MembershipInput>("membershipSchema");

export function MembershipForm({
  planSlug,
  areas,
}: {
  planSlug: string;
  areas: { value: string; label: string }[];
}) {
  const t = useTranslations("Forms");
  const tMember = useTranslations("Membership");
  const tCommon = useTranslations("Common");
  const { metaFields, getMeta, resetMeta } = useFormMeta();
  const state = useSubmission();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<MembershipInput>({
    resolver,
    // Focus after a failed submit is handled by focusFirstInvalid.
    shouldFocusError: false,
    // Only the fields that can be hidden need defaults; the rest keep what is
    // already in the page (including anything typed before this script loaded).
    defaultValues: { recipientName: "", recipientPhone: "" },
  });

  const role = useWatch({ control, name: "requesterRole" });
  const area = useWatch({ control, name: "area" });
  const outsideArea = area === OTHER_AREA;

  const onSubmit = handleSubmit(async (values) => {
    const started = await state.submit(() =>
      startMembership(planSlug, values, getMeta()),
    );
    if (started?.url) {
      // Leave the button in its pending state while the browser navigates to
      // Stripe's hosted checkout page.
      window.location.assign(started.url);
      return;
    }
    resetMeta();
    if (started) state.fail("server");
  }, focusFirstInvalid);

  return (
    <form
      onSubmit={onSubmit}
      onFocus={preloadValidation}
      noValidate
      className="relative flex flex-col gap-6"
    >
      <GroupTitle>{tMember("payerTitle")}</GroupTitle>

      <Field label={tMember("payerName")} error={errors.payerName}>
        {(props) => (
          <input
            {...props}
            {...register("payerName")}
            type="text"
            autoComplete="name"
            className={controlClass}
          />
        )}
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={t("phone")} error={errors.payerPhone}>
          {(props) => (
            <input
              {...props}
              {...register("payerPhone")}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              className={controlClass}
            />
          )}
        </Field>
        <Field
          label={t("email")}
          help={tMember("payerEmailHelp")}
          error={errors.payerEmail}
        >
          {(props) => (
            <input
              {...props}
              {...register("payerEmail")}
              type="email"
              inputMode="email"
              autoComplete="email"
              className={controlClass}
            />
          )}
        </Field>
      </div>

      <GroupTitle>{tMember("recipientTitle")}</GroupTitle>

      <ChoiceGroup legend={tMember("whoLabel")} error={errors.requesterRole}>
        {(["SELF", "FAMILY", "OTHER"] as const).map((value) => (
          <Choice
            key={value}
            label={t(`role.${value}`)}
            value={value}
            defaultChecked={value === "FAMILY"}
            {...register("requesterRole")}
          />
        ))}
      </ChoiceGroup>

      {role !== "SELF" ? (
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label={tMember("recipientName")} error={errors.recipientName}>
            {(props) => (
              <input
                {...props}
                {...register("recipientName")}
                type="text"
                className={controlClass}
              />
            )}
          </Field>
          <Field
            label={tMember("recipientPhone")}
            optional
            error={errors.recipientPhone}
          >
            {(props) => (
              <input
                {...props}
                {...register("recipientPhone")}
                type="tel"
                inputMode="tel"
                className={controlClass}
              />
            )}
          </Field>
        </div>
      ) : null}

      <GroupTitle>{tMember("addressTitle")}</GroupTitle>

      <Field
        label={tMember("address")}
        help={tMember("addressHelp")}
        error={errors.serviceAddress}
      >
        {(props) => (
          <input
            {...props}
            {...register("serviceAddress")}
            type="text"
            autoComplete="street-address"
            className={controlClass}
          />
        )}
      </Field>

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
            {areas.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
            <option value={OTHER_AREA}>{tCommon("other")}</option>
          </select>
        )}
      </Field>

      {outsideArea ? (
        <div
          role="status"
          className="flex flex-col items-start gap-4 rounded-2xl border-2 border-honey bg-honey-soft p-5"
        >
          <p className="text-lg text-forest-950">{tMember("outsideArea")}</p>
          <ButtonLink
            href={{ pathname: "/book", query: { plan: planSlug } }}
            variant="secondary"
            size="md"
          >
            {tMember("outsideAreaCta")}
          </ButtonLink>
        </div>
      ) : null}

      <Field
        label={tMember("notes")}
        optional
        help={tMember("notesHelp")}
        error={errors.notes}
      >
        {(props) => (
          <textarea
            {...props}
            {...register("notes")}
            rows={3}
            className={`${controlClass} py-3`}
          />
        )}
      </Field>

      <ConsentField error={errors.consent} {...register("consent")}>
        {tMember.rich("terms", {
          terms: (chunks) => (
            <Link href="/terms" target="_blank">
              {chunks}
            </Link>
          ),
        })}
      </ConsentField>

      {metaFields}
      <ServerError error={state.serverError} />
      <div className="flex flex-col gap-3">
        <SubmitButton
          pending={state.pending}
          pendingLabel={tMember("redirecting")}
          disabled={outsideArea}
        >
          <LockIcon aria-hidden="true" />
          {tMember("submit")}
        </SubmitButton>
      </div>
    </form>
  );
}
