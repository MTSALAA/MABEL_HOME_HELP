"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { InfoIcon, Trash2Icon } from "lucide-react";
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
} from "./form-fields";
import { Panel } from "./ui";
import { runAction } from "./run-action";

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
      else toast.success("Plan saved. The website is updated.");
      router.push("/admin/plans");
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div className="flex min-w-0 flex-col gap-6">
        <Panel title="Text">
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
                  label="Plan name"
                  error={errors.nameEn?.message}
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
                  label="Price shown on the website"
                  help="Free text, for example “$200/month”, “$15–$20 per visit” or “Custom quote”."
                  error={errors.priceTextEn?.message}
                  defaultValue={initial.priceTextEn}
                  {...register("priceTextEn")}
                />
                <TextField
                  label="Includes"
                  help="For example “4 visits” or “Up to 45 minutes”."
                  error={errors.includesEn?.message}
                  defaultValue={initial.includesEn}
                  {...register("includesEn")}
                />
                <TextAreaField
                  label="Short note (optional)"
                  rows={2}
                  error={errors.noteEn?.message}
                  defaultValue={initial.noteEn}
                  {...register("noteEn")}
                />
              </>
            }
            french={
              <>
                <TextField
                  label="Nom du forfait"
                  lang="fr"
                  error={errors.nameFr?.message}
                  defaultValue={initial.nameFr}
                  {...register("nameFr")}
                />
                <TextField
                  label="Prix affiché sur le site"
                  lang="fr"
                  help="Par exemple « 200 $ par mois » ou « Sur devis »."
                  error={errors.priceTextFr?.message}
                  defaultValue={initial.priceTextFr}
                  {...register("priceTextFr")}
                />
                <TextField
                  label="Comprend"
                  lang="fr"
                  error={errors.includesFr?.message}
                  defaultValue={initial.includesFr}
                  {...register("includesFr")}
                />
                <TextAreaField
                  label="Courte note (facultatif)"
                  lang="fr"
                  rows={2}
                  error={errors.noteFr?.message}
                  defaultValue={initial.noteFr}
                  {...register("noteFr")}
                />
              </>
            }
          />
        </Panel>

        <Panel
          title="Online purchase"
          description="Let visitors subscribe to this plan by card, billed every month."
        >
          <div className="flex flex-col gap-4">
            <SwitchField
              label="Buy online"
              description="Shows a “Join now” button. When off, visitors see “Request this plan”."
              checked={isPurchasable}
              onCheckedChange={(value) =>
                setValue("isPurchasable", value, { shouldDirty: true })
              }
            />
            {isPurchasable ? (
              <>
                <TextField
                  label="Monthly amount (CAD)"
                  inputMode="decimal"
                  placeholder="200.00"
                  help="The amount actually charged each month. Make it match the price shown above."
                  error={errors.monthlyAmount?.message}
                  {...register("monthlyAmount")}
                />
                <p className="flex items-start gap-2.5 rounded-lg border border-forest-300 bg-forest-50 p-3 text-sm text-forest-950">
                  <InfoIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>
                    {hasStripePrice
                      ? "Changing the amount creates a new price for new members only. "
                      : "Saving creates the price in Stripe for you. "}
                    {activeMembers > 0
                      ? `The ${activeMembers} current member${activeMembers === 1 ? "" : "s"} keep${activeMembers === 1 ? "s" : ""} the price they signed up with.`
                      : "Existing members always keep the price they signed up with."}
                  </span>
                </p>
                {!stripeEnabled ? (
                  <p className="rounded-lg border-2 border-honey bg-honey-soft p-3 text-sm font-bold text-forest-950">
                    Stripe is not connected yet. You can save this, but the “Join now”
                    button only appears once Stripe keys are added to the site.
                  </p>
                ) : null}
              </>
            ) : null}
          </div>
        </Panel>
      </div>

      <div className="flex min-w-0 flex-col gap-6">
        <Panel title="Visibility">
          <div className="flex flex-col gap-3">
            <SwitchField
              label="Shown on the website"
              description="Turn off to hide the plan. Existing members are not affected."
              checked={isActive}
              onCheckedChange={(value) => setValue("isActive", value, { shouldDirty: true })}
            />
            <SwitchField
              label="Highlight as “Most popular”"
              checked={isHighlighted}
              onCheckedChange={(value) =>
                setValue("isHighlighted", value, { shouldDirty: true })
              }
            />
          </div>
        </Panel>

        <Panel title="Web address">
          <TextField
            label="Slug"
            help="Used in links such as /membership/slug. Lowercase letters, numbers and dashes."
            error={errors.slug?.message}
            defaultValue={initial.slug}
            {...register("slug", {
              onChange: () => setSlugEdited(true),
            })}
          />
        </Panel>

        <FormError message={formError} />
        <div className="flex flex-wrap gap-3">
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "Saving…" : id ? "Save changes" : "Create plan"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.push("/admin/plans")}
          >
            Cancel
          </Button>
        </div>

        {id ? (
          <Panel
            title="Delete this plan"
            description="A plan that has had members is hidden instead of deleted, and its members are not affected."
          >
            <ConfirmAction
              trigger={
                <Button type="button" variant="destructive">
                  <Trash2Icon aria-hidden="true" />
                  Delete plan
                </Button>
              }
              title="Delete this plan?"
              description="It will be removed from the website."
              confirmLabel="Delete"
              action={async () => {
                const result = await runAction(() => deletePlan(id));
                if (result.ok) {
                  toast.success(
                    result.hidden
                      ? "This plan has members, so it was hidden instead."
                      : "Plan deleted.",
                  );
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
