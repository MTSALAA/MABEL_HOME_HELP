import {
  ClockIcon,
  MailIcon,
  MapPinIcon,
  MessageSquareTextIcon,
  PhoneIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { ContactForm } from "@/components/forms/contact-form";
import { ScopeNote } from "@/components/public/cards";
import { EmailText } from "@/components/public/email-text";
import { PageHero, Section } from "@/components/public/section";
import { pageMetadata } from "@/lib/metadata";
import { formatPhone, smsHref, telHref } from "@/lib/phone";
import { getSettings } from "@/server/queries/content";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Contact");
  return pageMetadata({
    locale,
    path: "/contact",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

function ContactRow({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-forest-100 text-forest-700">
        {icon}
      </span>
      <div>
        <h3 className="font-sans text-base font-bold tracking-wide text-ink-muted uppercase">
          {title}
        </h3>
        <div className="mt-0.5 text-xl font-bold text-forest-900">{children}</div>
      </div>
    </div>
  );
}

const linkClass = "rounded-lg underline-offset-4 hover:underline";

export default async function ContactPage() {
  const locale = await getLocale();
  const t = await getTranslations("Contact");
  const settings = await getSettings(locale);
  const phone = settings.phone;

  return (
    <>
      <PageHero title={t("title")} lead={t("lead")} />

      <Section tone="cream" className="md:py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-14">
          <div className="flex flex-col gap-7">
            <ContactRow
              icon={<PhoneIcon className="size-6" aria-hidden="true" />}
              title={t("phoneTitle")}
            >
              {phone ? (
                <a href={telHref(phone)} className={linkClass}>
                  {formatPhone(phone)}
                </a>
              ) : (
                <span className="font-normal text-ink-muted">{t("notProvided")}</span>
              )}
            </ContactRow>

            {phone ? (
              <ContactRow
                icon={<MessageSquareTextIcon className="size-6" aria-hidden="true" />}
                title={t("textTitle")}
              >
                <a href={smsHref(phone)} className={linkClass}>
                  {formatPhone(phone)}
                </a>
              </ContactRow>
            ) : null}

            <ContactRow
              icon={<MailIcon className="size-6" aria-hidden="true" />}
              title={t("emailTitle")}
            >
              {settings.email ? (
                <a href={`mailto:${settings.email}`} className={linkClass}>
                  <EmailText email={settings.email} />
                </a>
              ) : (
                <span className="font-normal text-ink-muted">{t("notProvided")}</span>
              )}
            </ContactRow>

            {settings.hours ? (
              <ContactRow
                icon={<ClockIcon className="size-6" aria-hidden="true" />}
                title={t("hoursTitle")}
              >
                <span className="font-normal">{settings.hours}</span>
              </ContactRow>
            ) : null}

            <ContactRow
              icon={<MapPinIcon className="size-6" aria-hidden="true" />}
              title={t("locationTitle")}
            >
              <span className="font-normal">{settings.location}</span>
            </ContactRow>

            <div className="rounded-3xl border border-cream-300 bg-white p-6">
              <h2 className="text-2xl font-bold text-forest-900">{t("areasTitle")}</h2>
              <ul className="mt-4 flex flex-wrap gap-2.5">
                {settings.serviceAreas.map((area) => (
                  <li
                    key={area}
                    className="rounded-full bg-forest-100 px-4 py-2 font-bold text-forest-900"
                  >
                    {area}
                  </li>
                ))}
              </ul>
            </div>

            <ScopeNote text={settings.disclaimer} />
          </div>

          <div className="rounded-3xl border border-cream-300 bg-white p-6 shadow-soft md:p-9">
            <h2 className="mb-6 text-[1.75rem] leading-tight font-bold text-forest-900">
              {t("formTitle")}
            </h2>
            <ContactForm />
          </div>
        </div>
      </Section>
    </>
  );
}
