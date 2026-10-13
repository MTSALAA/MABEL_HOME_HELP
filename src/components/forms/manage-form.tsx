"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import type { ManageInput } from "@/lib/validation/public";
import { requestPortalLink } from "@/server/actions/public";
import {
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

// Zod and the schema load when the form is first used, not with the page.
const resolver = lazySchemaResolver<ManageInput>("manageSchema");

export function ManageForm() {
  const t = useTranslations("Forms");
  const tManage = useTranslations("Membership.manage");
  const { metaFields, getMeta, resetMeta } = useFormMeta();
  const state = useSubmission();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ManageInput>({
    resolver,
    // Focus after a failed submit is handled by focusFirstInvalid.
    shouldFocusError: false,
  });

  const onSubmit = handleSubmit(async (values) => {
    const sent = await state.submit(() => requestPortalLink(values, getMeta()));
    resetMeta();
    if (sent) state.finish();
  }, focusFirstInvalid);

  if (state.done) {
    // Same message whether or not a membership exists for that email.
    return (
      <SuccessPanel title={tManage("sentTitle")} body={tManage("sentBody")} />
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      onFocus={preloadValidation}
      noValidate
      className="relative flex flex-col gap-6"
    >
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
      {metaFields}
      <ServerError error={state.serverError} />
      <div>
        <SubmitButton pending={state.pending}>{tManage("submit")}</SubmitButton>
      </div>
    </form>
  );
}
