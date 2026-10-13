import { CalendarCheckIcon, MessageSquareTextIcon, PhoneIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { formatPhone, smsHref, telHref } from "@/lib/phone";
import { cn } from "@/lib/utils";
import { ButtonAnchor, ButtonLink } from "./button-link";

/** Call Now, Text Us and Book a Service, as large buttons. */
export async function ContactActions({
  phone,
  onDark = false,
  className,
}: {
  phone: string | null;
  onDark?: boolean;
  className?: string;
}) {
  const t = await getTranslations("Actions");
  const tCommon = await getTranslations("Common");
  // "Call Now: (780) 555-0123": the visible words first, then the number.
  const withNumber = (label: string) =>
    phone ? tCommon("labelWithDetail", { label, detail: formatPhone(phone) }) : label;

  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:flex-wrap", className)}>
      {phone ? (
        <ButtonAnchor
          href={telHref(phone)}
          variant={onDark ? "honey" : "primary"}
          aria-label={withNumber(t("callNow"))}
        >
          <PhoneIcon aria-hidden="true" />
          {t("callNow")}
        </ButtonAnchor>
      ) : null}
      {phone ? (
        <ButtonAnchor
          href={smsHref(phone)}
          variant={onDark ? "outlineOnDark" : "secondary"}
          aria-label={withNumber(t("textUs"))}
        >
          <MessageSquareTextIcon aria-hidden="true" />
          {t("textUs")}
        </ButtonAnchor>
      ) : null}
      <ButtonLink
        href="/book"
        variant={
          phone ? (onDark ? "onDark" : "secondary") : onDark ? "honey" : "primary"
        }
      >
        <CalendarCheckIcon aria-hidden="true" />
        {t("book")}
      </ButtonLink>
    </div>
  );
}

/** Closing call-to-action band used at the bottom of most pages. */
export async function CtaBand({
  title,
  body,
  phone,
}: {
  title: string;
  body: string;
  phone: string | null;
}) {
  return (
    <section className="bg-forest-900 py-16 text-cream-50 md:py-20">
      <div className="page-container flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <h2 className="text-[2rem] leading-tight font-bold md:text-[2.5rem]">
            {title}
          </h2>
          <p className="mt-3 text-xl text-cream-50/90">{body}</p>
          {phone ? (
            <p className="mt-4 font-display text-3xl font-bold text-honey">
              <a href={telHref(phone)} className="rounded-lg hover:underline">
                {formatPhone(phone)}
              </a>
            </p>
          ) : null}
        </div>
        <ContactActions phone={phone} onDark className="lg:justify-end" />
      </div>
    </section>
  );
}
