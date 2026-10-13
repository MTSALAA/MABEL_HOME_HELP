import { CalendarCheckIcon, MessageSquareTextIcon, PhoneIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { smsHref, telHref } from "@/lib/phone";
import { ActionBarFrame } from "./action-bar-frame";

const itemClass =
  "flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-xl px-2 text-center text-[0.95rem] font-bold leading-tight whitespace-nowrap";

/**
 * Call, Text and Book within thumb's reach on phones and tablets. It is a
 * slim floating bar that steps aside while the visitor reads or types (see
 * ActionBarFrame). Until a phone number is set in the admin there is nothing
 * to call or text, so it becomes a single small "Book" button in the corner.
 */
export async function ActionBar({ phone }: { phone: string | null }) {
  const t = await getTranslations("Actions");

  if (!phone) {
    return (
      <ActionBarFrame label={t("quickActions")} floating>
        <Link
          href="/book"
          className="flex min-h-12 items-center gap-2 rounded-full bg-forest-700 px-5 text-[1rem] font-bold text-white shadow-[0_8px_24px_rgb(31_61_43/0.30)]"
        >
          <CalendarCheckIcon className="size-5" aria-hidden="true" />
          {t("book")}
        </Link>
      </ActionBarFrame>
    );
  }

  return (
    <ActionBarFrame label={t("quickActions")} floating={false}>
      <ul className="flex items-stretch gap-1.5">
        <li className="flex flex-1">
          <a href={telHref(phone)} className={`${itemClass} bg-forest-700 text-white`}>
            <PhoneIcon className="size-[1.1rem] shrink-0" aria-hidden="true" />
            {t("callNow")}
          </a>
        </li>
        <li className="flex flex-1">
          <a
            href={smsHref(phone)}
            className={`${itemClass} border-2 border-forest-700 bg-white text-forest-900`}
          >
            <MessageSquareTextIcon className="size-[1.1rem] shrink-0" aria-hidden="true" />
            {t("textUs")}
          </a>
        </li>
        <li className="flex flex-1">
          <Link href="/book" className={`${itemClass} bg-honey text-forest-950`}>
            <CalendarCheckIcon className="size-[1.1rem] shrink-0" aria-hidden="true" />
            {/* Short label so three buttons fit side by side on a phone. */}
            <span aria-hidden="true">{t("bookShort")}</span>
            <span className="sr-only">{t("book")}</span>
          </Link>
        </li>
      </ul>
    </ActionBarFrame>
  );
}
