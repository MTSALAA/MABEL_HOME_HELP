"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { InfoIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/utils";
import { planSchema, type PlanInput } from "@/lib/validation/admin";
import { deletePlan, savePlan } from "@/server/actions/admin/content";
import { ConfirmAction } from "./detail-controls";
import {
  FormError,
  LanguageTabs,
  SwitchField,
  TextAreaField,
  TextField,
  useValidationMessage,
} from "./form-fields";
import { Panel } from "./ui";
import { useRunAction } from "./run-action";

export function PlanForm({
  id,
  initial,
  stripeEnabled,
  hasStripePrice,
  activeMembers,
}: {
  id: string | null;
  initial: PlanInput;
  stripeEnabled: boolean;
  hasStripePrice: boolean;
  activeMembers: number;
}) {
  const t = useTranslations("Admin.Plans");
  const tCommon = useTranslations("Admin.Common");
  const msg = useValidationMessage();
  const runAction = useRunAction();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    control,
    formState: { errors },
  } = useForm<PlanInput>({
    resolver: zodResolver(planSchema),
    // Text fields take their value from the HTML (defaultValue). The switches
    // and the amount (shown only when Buy online is on) live here.
    defaultValues: {
      isActive: initial.isActive,
      isHighlighted: initial.isHighlighted,
      isPurchasable: initial.isPurchasable,
      monthlyAmount: initial.monthlyAmount,
    },
  });

  // Once the owner edits the slug by hand, stop deriving it from the name.
  const [slugEdited, setSlugEdited] = useState(false);
  const isActive = useWatch({ control, name: "isActive" });
  const isHighlighted = useWatch({ control, name: "isHighlighted" });
  const isPurchasable = useWatch({ control, name: "isPurchasable" });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      const result = await runAction(() => savePlan(id, values));
      if (!result.ok) {
        setFormError(result.error);
        for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
          setError(field as keyof PlanInput, { message });
        }
        return;
      }
      if (result.warning) toast.warning(result.warning, { duration: 10000 });
      else toast.success(t("saved"));
      router.push("/admin/plans");
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div className="flex min-w-0 flex-col gap-6">
        <Panel title={t("textPanel")}>
          <LanguageTabs
            englishHasError={Boolean(
              errors.nameEn || errors.priceTextEn || errors.includesEn || errors.noteEn,
            )}
            frenchHasError={Boolean(
              errors.nameFr || errors.priceTextFr || errors.includesFr || errors.noteFr,
            )}
            english={
              <>
                <TextField
                  label={t("fields.name")}
                  error={msg(errors.nameEn?.message)}
                  defaultValue={initial.nameEn}
                  {...register("nameEn", {
                    onChange: (event) => {
                      if (!id && !slugEdited) {
                        setValue("slug", slugify(event.target.value));
                      }
                    },
                  })}
                />
                <TextField
                  label={t("fields.priceText")}
                  help={t("fields.priceTextHelp")}
                  error={msg(errors.priceTextEn?.message)}
                  defaultValue={initial.priceTextEn}
                  {...register("priceTextEn")}
                />
                <TextField
                  label={t("fields.includes")}
                  help={t("fields.includesHelp")}
                  error={msg(errors.includesEn?.message)}
                  defaultValue={initial.includesEn}
                  {...register("includesEn")}
                />
                <TextAreaField
                  label={t("fields.note")}
                  rows={2}
                  error={msg(errors.noteEn?.message)}
                  defaultValue={initial.noteEn}
                  {...register("noteEn")}
                />
              </>
            }
            french={
              <>
                <TextField
                  label={t("french.name")}
                  lang="fr"
                  error={msg(errors.nameFr?.message)}
                  defaultValue={initial.nameFr}
                  {...register("nameFr")}
                />
                <TextField
                  label={t("french.priceText")}
                  lang="fr"
                  help={t("french.priceTextHelp")}
                  error={msg(errors.priceTextFr?.message)}
                  defaultValue={initial.priceTextFr}
                  {...register("priceTextFr")}
                />
                <TextField
                  label={t("french.includes")}
                  lang="fr"
                  error={msg(errors.includesFr?.message)}
                  defaultValue={initial.includesFr}
                  {...register("includesFr")}
                />
                <TextAreaField
                  label={t("french.note")}
                  lang="fr"
                  rows={2}
                  error={msg(errors.noteFr?.message)}
                  defaultValue={initial.noteFr}
                  {...register("noteFr")}
                />
              </>
            }
          />
        </Panel>

        <Panel
          title={t("online.title")}
          description={t("online.description")}
        >
          <div className="flex flex-col gap-4">
            <SwitchField
              label={t("online.buyOnline")}
              description={t("online.buyOnlineDescription")}
              checked={isPurchasable}
              onCheckedChange={(value) =>
                setValue("isPurchasable", value, { shouldDirty: true })
              }
            />
            {isPurchasable ? (
              <>
                <TextField
                  label={t("online.amount")}
                  inputMode="decimal"
                  placeholder="200.00"
                  help={t("online.amountHelp")}
                  error={msg(errors.monthlyAmount?.message)}
                  {...register("monthlyAmount")}
                />
                <p className="flex items-start gap-2.5 rounded-lg border border-forest-300 bg-forest-50 p-3 text-sm text-forest-950">
                  <InfoIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>
                    {hasStripePrice ? t("online.changingPrice") : t("online.creatingPrice")}{" "}
                    {activeMembers > 0
                      ? t("online.currentMembers", { count: activeMembers })
                      : t("online.existingMembers")}
                  </span>
                </p>
                {!stripeEnabled ? (
                  <p className="rounded-lg border-2 border-honey bg-honey-soft p-3 text-sm font-bold text-forest-950">
                    {t("online.stripeNotConnected")}
                  </p>
                ) : null}
              </>
            ) : null}
          </div>
        </Panel>
      </div>

      <div className="flex min-w-0 flex-col gap-6">
        <Panel title={t("visibility.title")}>
          <div className="flex flex-col gap-3">
            <SwitchField
              label={t("visibility.shown")}
              description={t("visibility.shownDescription")}
              checked={isActive}
              onCheckedChange={(value) => setValue("isActive", value, { shouldDirty: true })}
            />
            <SwitchField
              label={t("visibility.highlight")}
              checked={isHighlighted}
              onCheckedChange={(value) =>
                setValue("isHighlighted", value, { shouldDirty: true })
              }
            />
          </div>
        </Panel>

        <Panel title={t("address.title")}>
          <TextField
            label={t("address.slug")}
            help={t("address.slugHelp")}
            error={msg(errors.slug?.message)}
            defaultValue={initial.slug}
            {...register("slug", {
              onChange: () => setSlugEdited(true),
            })}
          />
        </Panel>

        <FormError message={formError} />
        <div className="flex flex-wrap gap-3">
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? tCommon("saving") : id ? tCommon("saveChanges") : t("create")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.push("/admin/plans")}
          >
            {tCommon("cancel")}
          </Button>
        </div>

        {id ? (
          <Panel
            title={t("delete.title")}
            description={t("delete.description")}
          >
            <ConfirmAction
              trigger={
                <Button type="button" variant="destructive">
                  <Trash2Icon aria-hidden="true" />
                  {t("delete.button")}
                </Button>
              }
              title={t("delete.confirmTitle")}
              description={t("delete.confirmDescription")}
              confirmLabel={tCommon("delete")}
              action={async () => {
                const result = await runAction(() => deletePlan(id));
                if (result.ok) {
                  toast.success(result.hidden ? t("delete.hidden") : t("delete.done"));
                  router.push("/admin/plans");
                }
                return result;
              }}
            />
          </Panel>
        ) : null}
      </div>
    </form>
  );
}
