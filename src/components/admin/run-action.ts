import { useTranslations } from "next-intl";
import type { AdminResult } from "@/lib/validation/admin";

type Failure = Extract<AdminResult, { ok: false }>;

/**
 * Returns a function that awaits an admin Server Action. A call that rejects
 * (connection lost, the item was deleted in another tab, a server error)
 * comes back as an ordinary error result, so every caller shows a message
 * instead of breaking the page.
 */
export function useRunAction() {
  const t = useTranslations("Admin.Common");
  const failed: Failure = { ok: false, error: t("actionFailed") };

  return async function runAction<R extends AdminResult | void>(
    action: () => Promise<R>,
  ): Promise<R | Failure> {
    try {
      return await action();
    } catch (error) {
      // Redirects from Server Actions travel as a thrown value: let them through.
      const digest = (error as { digest?: unknown } | null)?.digest;
      if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) {
        throw error;
      }
      return failed;
    }
  };
}
