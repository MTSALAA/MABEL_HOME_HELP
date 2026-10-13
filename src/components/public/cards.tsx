import { ArrowRightIcon, CheckIcon, InfoIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { LocalizedPlan, LocalizedService } from "@/lib/localize";
import { cn } from "@/lib/utils";
import { ButtonLink } from "./button-link";
import { Illustration } from "./illustration";

export { Illustration };

export async function ServiceCard({
  service,
  headingLevel = "h3",
}: {
  service: LocalizedService;
  headingLevel?: "h2" | "h3";
}) {
  const t = await getTranslations("Services");
  const tCommon = await getTranslations("Common");
  const Heading = headingLevel;

  return (
    <article className="group flex h-full flex-col rounded-3xl border border-cream-300 bg-white p-6 shadow-soft transition-shadow hover:shadow-lift">
      {service.imageUrl ? (
        // A photo the owner linked to, on any https host. A plain <img> avoids
        // the image optimizer's host allow-list (and proxying unknown hosts).
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={service.imageUrl}
          alt=""
          width={112}
          height={112}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="size-28 rounded-2xl bg-cream-100 object-cover"
        />
      ) : (
        <Illustration
          name={service.illustration}
          width={112}
          height={112}
          className="size-28"
        />
      )}
      <Heading className="mt-4 text-2xl leading-tight font-bold text-forest-900">
        {service.title}
      </Heading>
      <p className="mt-2 flex-1 text-ink-muted">{service.description}</p>
      <Link
        href={{ pathname: "/book", query: { service: service.slug } }}
        aria-label={tCommon("labelWithDetail", {
          label: t("request"),
          detail: service.title,
        })}
        className="mt-5 inline-flex min-h-11 items-center gap-2 self-start rounded-lg font-bold text-forest-700 underline-offset-4 hover:underline"
      >
        {t("request")}
        <ArrowRightIcon
          className="size-5 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </Link>
    </article>
  );
}

export async function PlanCard({ plan }: { plan: LocalizedPlan }) {
  const t = await getTranslations("Pricing");
  const tCommon = await getTranslations("Common");
  const dark = plan.isHighlighted;

  return (
    <article
      className={cn(
        "relative flex h-full flex-col rounded-3xl border p-7 shadow-soft",
        dark
          ? "border-forest-900 bg-forest-900 text-cream-50"
          : "border-cream-300 bg-white",
      )}
    >
      {dark ? (
        <p className="absolute -top-4 left-7 rounded-full bg-honey px-4 py-1.5 text-sm font-bold tracking-wide text-forest-950 uppercase">
          {t("popular")}
        </p>
      ) : null}
      <h3
        className={cn(
          "text-2xl leading-tight font-bold",
          dark ? "text-cream-50" : "text-forest-900",
        )}
      >
        {plan.name}
      </h3>
      <p
        className={cn(
          "mt-3 font-display text-[2rem] leading-tight font-bold",
          dark ? "text-honey" : "text-forest-700",
        )}
      >
        {plan.priceText}
      </p>
      <p className="mt-4 flex items-start gap-2.5 text-lg font-bold">
        <CheckIcon
          className={cn("mt-1 size-5 shrink-0", dark ? "text-honey" : "text-forest-500")}
          aria-hidden="true"
        />
        <span>
          <span className="sr-only">{t("includes")}: </span>
          {plan.includes}
        </span>
      </p>
      {plan.note ? (
        <p className={cn("mt-3 flex-1", dark ? "text-cream-50/85" : "text-ink-muted")}>
          {plan.note}
        </p>
      ) : (
        <div className="flex-1" />
      )}
      <div className="mt-6">
        {plan.canBuyOnline ? (
          <ButtonLink
            href={`/membership/${plan.slug}`}
            variant={dark ? "honey" : "primary"}
            className="w-full"
            aria-label={tCommon("labelWithDetail", {
              label: t("join"),
              detail: plan.name,
            })}
          >
            {t("join")}
          </ButtonLink>
        ) : (
          <ButtonLink
            href={{ pathname: "/book", query: { plan: plan.slug } }}
            variant={dark ? "onDark" : "secondary"}
            className="w-full"
            aria-label={tCommon("labelWithDetail", {
              label: t("request"),
              detail: plan.name,
            })}
          >
            {t("request")}
          </ButtonLink>
        )}
      </div>
    </article>
  );
}

/** The non-medical scope statement, shown prominently where it matters. */
export async function ScopeNote({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const t = await getTranslations("Common");
  return (
    <aside
      className={cn(
        "flex items-start gap-4 rounded-2xl border-2 border-honey bg-honey-soft p-5 text-forest-950",
        className,
      )}
    >
      <InfoIcon className="mt-0.5 size-6 shrink-0 text-forest-900" aria-hidden="true" />
      <p>
        <strong>{t("scopeLabel")}: </strong>
        {text}
      </p>
    </aside>
  );
}
