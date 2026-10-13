import { CalendarCheckIcon, MessageSquareTextIcon, PhoneIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { smsHref, telHref } from "@/lib/phone";

const itemClass =
  "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-center text-[0.95rem] font-bold leading-tight";

/**
 * Sticky bar on phones and tablets: Call, Text and Book are always one tap
 * away. Call and Text are hidden (not shown broken) until a phone number is
 * set in the admin.
 */
export async function ActionBar({ phone }: { phone: string | null }) {
  const t = await getTranslations("Actions");

  return (
    <nav
      aria-label={t("quickActions")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-cream-300 bg-cream-50/97 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-6px_24px_rgb(31_61_43/0.10)] backdrop-blur lg:hidden print:hidden"
    >
      <ul className="mx-auto flex max-w-xl items-stretch gap-2">
        {phone ? (
          <>
            <li className="flex flex-1">
              <a
                href={telHref(phone)}
                className={`${itemClass} bg-forest-700 text-white`}
              >
                <PhoneIcon className="size-5" aria-hidden="true" />
                {t("callNow")}
              </a>
            </li>
            <li className="flex flex-1">
              <a
                href={smsHref(phone)}
                className={`${itemClass} border-2 border-forest-700 bg-white text-forest-900`}
              >
                <MessageSquareTextIcon className="size-5" aria-hidden="true" />
                {t("textUs")}
              </a>
            </li>
          </>
        ) : null}
        <li className="flex flex-1">
          <Link
            href="/book"
            className={`${itemClass} ${phone ? "bg-honey text-forest-950" : "bg-forest-700 text-white"}`}
          >
            <CalendarCheckIcon className="size-5" aria-hidden="true" />
            {/* Short label so three buttons fit side by side on a phone. */}
            <span aria-hidden="true">{t("bookShort")}</span>
            <span className="sr-only">{t("book")}</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
