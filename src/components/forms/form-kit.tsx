"use client";

import { CircleAlertIcon, LoaderCircleIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { FieldError, FieldValues, Resolver } from "react-hook-form";
import { buttonStyles } from "@/components/public/button-link";
import { Illustration } from "@/components/public/illustration";
import { cn } from "@/lib/utils";
import type {
  FormMeta,
  PublicFormError,
  PublicFormResult,
} from "@/lib/validation/public";

/** Large, high-contrast control style shared by inputs, selects and textareas. */
export const controlClass =
  "block w-full rounded-xl border-2 border-input bg-white px-4 text-lg text-ink placeholder:text-ink-muted/70 transition-colors hover:border-forest-500 focus-visible:border-forest-700 aria-[invalid=true]:border-danger min-h-[3.25rem]";

/**
 * Label, help text and error for one control. Returns the ids the control
 * needs through the render prop, so every field is correctly described for
 * screen readers.
 */
export function Field({
  label,
  optional = false,
  help,
  error,
  children,
  className,
}: {
  label: string;
  optional?: boolean;
  help?: string;
  error?: FieldError;
  className?: string;
  children: (props: {
    id: string;
    "aria-invalid": boolean;
    "aria-describedby": string | undefined;
  }) => ReactNode;
}) {
  const id = useId();
  const t = useTranslations("Common");
  const tErrors = useTranslations("Forms.errors");
  const helpId = help ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-lg font-bold text-forest-900">
        {label}
        {optional ? (
          <span className="ml-2 text-base font-normal text-ink-muted">
            ({t("optional")})
          </span>
        ) : null}
      </label>
      {children({
        id,
        "aria-invalid": Boolean(error),
        "aria-describedby": [errorId, helpId].filter(Boolean).join(" ") || undefined,
      })}
      {help ? (
        <p id={helpId} className="mt-1.5 text-base text-ink-muted">
          {help}
        </p>
      ) : null}
      {error?.message ? (
        <p
          id={errorId}
          className="mt-1.5 flex items-start gap-1.5 text-base font-bold text-danger"
        >
          <CircleAlertIcon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          {tErrors(error.message)}
        </p>
      ) : null}
    </div>
  );
}

/** Radio group drawn as large, easy-to-tap cards. */
export function ChoiceGroup({
  legend,
  error,
  children,
  columns = 3,
}: {
  legend: string;
  error?: FieldError;
  children: ReactNode;
  columns?: 1 | 3;
}) {
  const id = useId();
  const tErrors = useTranslations("Forms.errors");

  return (
    <fieldset aria-describedby={error ? `${id}-error` : undefined}>
      <legend className="mb-2 text-lg font-bold text-forest-900">{legend}</legend>
      <div className={cn("grid gap-3", columns === 3 && "sm:grid-cols-3")}>
        {children}
      </div>
      {error?.message ? (
        <p
          id={`${id}-error`}
          className="mt-1.5 flex items-start gap-1.5 text-base font-bold text-danger"
        >
          <CircleAlertIcon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          {tErrors(error.message)}
        </p>
      ) : null}
    </fieldset>
  );
}

export function Choice({
  label,
  ...inputProps
}: { label: string } & React.ComponentProps<"input">) {
  return (
    <label className="flex min-h-[3.25rem] cursor-pointer items-center gap-3 rounded-xl border-2 border-input bg-white px-4 py-2.5 text-lg transition-colors hover:border-forest-500 has-[:checked]:border-forest-700 has-[:checked]:bg-forest-100 has-[:checked]:font-bold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring">
      <input
        type="radio"
        className="size-5 shrink-0 accent-forest-700 focus-visible:outline-none"
        {...inputProps}
      />
      <span>{label}</span>
    </label>
  );
}

/** Consent checkbox. `children` is the rich-text label. */
export function ConsentField({
  error,
  children,
  ...inputProps
}: { error?: FieldError; children: ReactNode } & React.ComponentProps<"input">) {
  const id = useId();
  const tErrors = useTranslations("Forms.errors");

  return (
    <div>
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-1 size-6 shrink-0 rounded accent-forest-700"
          {...inputProps}
        />
        <label htmlFor={id} className="text-lg [&_a]:font-bold [&_a]:text-forest-700 [&_a]:underline">
          {children}
        </label>
      </div>
      {error?.message ? (
        <p
          id={`${id}-error`}
          className="mt-1.5 flex items-start gap-1.5 text-base font-bold text-danger"
        >
          <CircleAlertIcon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          {tErrors(error.message)}
        </p>
      ) : null}
    </div>
  );
}

// --- Spam protection ---------------------------------------------------------

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          appearance?: "always" | "execute" | "interaction-only";
          language?: string;
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

const TURNSTILE_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

function loadTurnstile(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.turnstile) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${TURNSTILE_SRC}"]`,
    );
    const script = existing ?? document.createElement("script");
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => reject(new Error("turnstile")));
    if (!existing) {
      script.src = TURNSTILE_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  });
}

/**
 * Honeypot field plus (when configured) a Cloudflare Turnstile widget that
 * only shows itself if a visitor needs to interact. `getMeta()` returns what
 * every public Server Action expects as its last argument.
 */
export function useFormMeta() {
  const locale = useLocale();
  const t = useTranslations("Forms");
  const honeypotRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const tokenRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !containerRef.current) return;
    let cancelled = false;
    const container = containerRef.current;

    loadTurnstile()
      .then(() => {
        if (cancelled || !window.turnstile || widgetIdRef.current) return;
        widgetIdRef.current = window.turnstile.render(container, {
          sitekey: TURNSTILE_SITE_KEY,
          appearance: "interaction-only",
          language: locale,
          callback: (token) => {
            tokenRef.current = token;
          },
          "expired-callback": () => {
            tokenRef.current = undefined;
          },
          "error-callback": () => {
            tokenRef.current = undefined;
          },
        });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [locale]);

  const getMeta = useCallback(
    (): FormMeta => ({
      locale: locale === "fr" ? "fr" : "en",
      turnstileToken: tokenRef.current,
      website: honeypotRef.current?.value || undefined,
    }),
    [locale],
  );

  /** A token is single use: get a fresh one after every submission. */
  const resetMeta = useCallback(() => {
    tokenRef.current = undefined;
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, []);

  const metaFields = (
    <>
      {/* Hidden from people, tempting to bots. */}
      <div className="absolute -left-[9999px] size-px overflow-hidden" aria-hidden="true">
        <label>
          {t("honeypot")}
          <input
            ref={honeypotRef}
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            defaultValue=""
          />
        </label>
      </div>
      {TURNSTILE_SITE_KEY ? <div ref={containerRef} /> : null}
    </>
  );

  return { metaFields, getMeta, resetMeta };
}

// --- Submit area and result panels -------------------------------------------

export function ServerError({ error }: { error: PublicFormError | null }) {
  const t = useTranslations("Forms.serverErrors");
  if (!error) return null;
  return (
    <p
      role="alert"
      className="flex items-start gap-2.5 rounded-xl border-2 border-danger bg-danger-soft p-4 text-lg font-bold text-danger"
    >
      <CircleAlertIcon className="mt-0.5 size-6 shrink-0" aria-hidden="true" />
      {t(error)}
    </p>
  );
}

export function SubmitButton({
  pending,
  pendingLabel,
  disabled,
  children,
}: {
  pending: boolean;
  pendingLabel?: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  const t = useTranslations("Common");
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending}
      className={cn(buttonStyles({ variant: "primary", size: "lg" }), "w-full sm:w-auto")}
    >
      {pending ? (
        <>
          <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
          {pendingLabel ?? t("sending")}
        </>
      ) : (
        children
      )}
    </button>
  );
}

/** Replaces the form after a successful submission and takes focus. */
export function SuccessPanel({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children?: ReactNode;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div
      role="status"
      className="flex flex-col items-center rounded-3xl border border-forest-300 bg-forest-50 px-6 py-10 text-center"
    >
      <Illustration name="success" width={200} height={160} className="h-40 w-auto" />
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mt-4 text-3xl leading-tight font-bold text-forest-900 outline-none"
      >
        {title}
      </h2>
      <p className="mt-3 max-w-md text-xl text-ink-muted">{body}</p>
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  );
}

type PublicSchemaName =
  | "bookingSchema"
  | "contactSchema"
  | "sponsorSchema"
  | "membershipSchema"
  | "manageSchema";

function loadValidation() {
  return Promise.all([
    import("@hookform/resolvers/zod"),
    import("@/lib/validation/public"),
  ]);
}

/** Start fetching the validation code; called when a form is first focused. */
export function preloadValidation() {
  void loadValidation().catch(() => undefined);
}

/**
 * A react-hook-form resolver for one of the public schemas that loads Zod and
 * the schemas on first use instead of with the page. Pages with forms stay
 * light, and so does every page that prefetches them. Create it once, at
 * module level.
 */
export function lazySchemaResolver<T extends FieldValues>(
  name: PublicSchemaName,
): Resolver<T> {
  let resolver: Promise<Resolver<T>> | undefined;
  return async (values, context, options) => {
    try {
      resolver ??= loadValidation().then(
        ([{ zodResolver }, schemas]) =>
          zodResolver(schemas[name]) as unknown as Resolver<T>,
      );
      return await (await resolver)(values, context, options);
    } catch {
      // The validation code could not be fetched (connection dropped). Let
      // the submission through: the server validates everything again, and
      // if it cannot be reached either, the form shows its error message.
      resolver = undefined;
      return { values, errors: {} };
    }
  };
}

/**
 * Pass as the second argument of handleSubmit(). Moves focus to the first
 * invalid field in reading order, so a keyboard or screen-reader user lands
 * on the first thing to fix. (react-hook-form's own focusing follows the
 * order fields were registered in, which is not the order on screen.)
 */
export function focusFirstInvalid(
  errors: Record<string, unknown>,
  event?: { target?: EventTarget | null },
) {
  const form = event?.target;
  if (!(form instanceof HTMLFormElement)) return;
  // form.elements is in document order; the first control whose name has an
  // error is the first thing to fix. (Matching on names, not on rendered
  // error styling, so it does not depend on when the page re-renders.)
  for (const control of Array.from(form.elements)) {
    if (
      (control instanceof HTMLInputElement ||
        control instanceof HTMLSelectElement ||
        control instanceof HTMLTextAreaElement) &&
      control.name in errors
    ) {
      control.focus();
      return;
    }
  }
}

/**
 * Owns the lifecycle of one public form submission. A dropped connection, or
 * a page left open across a new release, makes the Server Action call reject;
 * that becomes a visible error (with the phone number beside it) instead of a
 * button stuck on "Sending…".
 */
export function useSubmission() {
  const [pending, setPending] = useState(false);
  const [serverError, setServerError] = useState<PublicFormError | null>(null);
  const [done, setDone] = useState(false);

  /** Runs the action. Returns its result on success, or null after showing the error. */
  const submit = useCallback(
    async <T,>(
      action: () => Promise<PublicFormResult<T>>,
    ): Promise<({ ok: true } & T) | null> => {
      setPending(true);
      setServerError(null);
      try {
        const result = await action();
        if (result.ok) return result;
        setServerError(result.error);
      } catch {
        setServerError("server");
      }
      setPending(false);
      return null;
    },
    [],
  );

  return {
    pending,
    serverError,
    done,
    submit,
    /** Shows the success panel. */
    finish: () => {
      setPending(false);
      setDone(true);
    },
    /** Shows an error after a result that could not be used. */
    fail: (error: PublicFormError) => {
      setPending(false);
      setServerError(error);
    },
    /** Back to an empty form ("Send another request"). */
    restart: () => setDone(false),
  };
}
