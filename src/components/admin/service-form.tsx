"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SERVICE_ILLUSTRATIONS } from "@/lib/constants";
import { cn, slugify } from "@/lib/utils";
import { serviceSchema, type ServiceInput } from "@/lib/validation/admin";
import { deleteService, saveService } from "@/server/actions/admin/content";
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

export function ServiceForm({
  id,
  initial,
}: {
  id: string | null;
  initial: ServiceInput;
}) {
  const t = useTranslations("Admin.Services");
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
  } = useForm<ServiceInput>({
    resolver: zodResolver(serviceSchema),
    // Text fields take their value from the HTML (defaultValue), so they are
    // filled in before this script loads. Only the switches live here.
    defaultValues: { isActive: initial.isActive, isFeatured: initial.isFeatured },
  });

  const illustration =
    useWatch({ control, name: "illustration" }) ?? initial.illustration;
  // Once the owner edits the slug by hand, stop deriving it from the title.
  const [slugEdited, setSlugEdited] = useState(false);
  const isActive = useWatch({ control, name: "isActive" });
  const isFeatured = useWatch({ control, name: "isFeatured" });
  // Name of a drawing, for its tooltip and its text alternative.
  const illustrationName = (name: string) =>
    t.has(`illustrations.${name}`)
      ? t(`illustrations.${name}`)
      : name.replace(/-/g, " ");

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      const result = await runAction(() => saveService(id, values));
      if (!result.ok) {
        setFormError(result.error);
        for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
          setError(field as keyof ServiceInput, { message });
        }
        return;
      }
      toast.success(t("saved"));
      router.push("/admin/services");
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div className="flex min-w-0 flex-col gap-6">
        <Panel title={t("textPanel")}>
          <LanguageTabs
            englishHasError={Boolean(errors.titleEn || errors.descriptionEn)}
            frenchHasError={Boolean(errors.titleFr || errors.descriptionFr)}
            english={
              <>
                <TextField
                  label={t("fields.title")}
                  error={msg(errors.titleEn?.message)}
                  defaultValue={initial.titleEn}
                  {...register("titleEn", {
                    onChange: (event) => {
                      // New services get their web address from the title
                      // until the owner edits the slug by hand.
                      if (!id && !slugEdited) {
                        setValue("slug", slugify(event.target.value));
                      }
                    },
                  })}
                />
                <TextAreaField
                  label={t("fields.description")}
                  rows={3}
                  error={msg(errors.descriptionEn?.message)}
                  defaultValue={initial.descriptionEn}
                  {...register("descriptionEn")}
                />
              </>
            }
            french={
              <>
                <TextField
                  label={t("french.title")}
                  lang="fr"
                  error={msg(errors.titleFr?.message)}
                  defaultValue={initial.titleFr}
                  {...register("titleFr")}
                />
                <TextAreaField
                  label={t("french.description")}
                  lang="fr"
                  rows={3}
                  error={msg(errors.descriptionFr?.message)}
                  defaultValue={initial.descriptionFr}
                  {...register("descriptionFr")}
                />
              </>
            }
          />
        </Panel>

        <Panel
          title={t("illustration.title")}
          description={t("illustration.description")}
        >
          <fieldset>
            <legend className="sr-only">{t("illustration.title")}</legend>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-7">
              {SERVICE_ILLUSTRATIONS.map((name) => (
                <label
                  key={name}
                  title={illustrationName(name)}
                  className={cn(
                    "cursor-pointer rounded-xl border-2 bg-cream-50 p-1 transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-ring",
                    illustration === name
                      ? "border-forest-700 bg-forest-100"
                      : "border-transparent hover:border-cream-300",
                  )}
                >
                  <input
                    type="radio"
                    value={name}
                    defaultChecked={name === initial.illustration}
                    className="sr-only"
                    {...register("illustration")}
                  />
                  <Image
                    src={`/illustrations/${name}.svg`}
                    alt={illustrationName(name)}
                    width={80}
                    height={80}
                    unoptimized
                    className="h-auto w-full"
                  />
                </label>
              ))}
            </div>
            {errors.illustration?.message ? (
              <p className="mt-2 text-sm font-bold text-danger">
                {msg(errors.illustration.message)}
              </p>
            ) : null}
          </fieldset>
          <TextField
            frameClassName="mt-5"
            label={t("illustration.ownImage")}
            type="url"
            placeholder="https://"
            help={t("illustration.ownImageHelp")}
            error={msg(errors.imageUrl?.message)}
            defaultValue={initial.imageUrl}
            {...register("imageUrl")}
          />
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
              label={t("visibility.featured")}
              description={t("visibility.featuredDescription")}
              checked={isFeatured}
              onCheckedChange={(value) => setValue("isFeatured", value, { shouldDirty: true })}
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
            onClick={() => router.push("/admin/services")}
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
                const result = await runAction(() => deleteService(id));
                if (result.ok) {
                  toast.success(result.hidden ? t("delete.hidden") : t("delete.done"));
                  router.push("/admin/services");
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
