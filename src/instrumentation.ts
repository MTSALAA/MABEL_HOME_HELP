import type { Instrumentation } from "next";
import { after } from "next/server";

type SentryModule = typeof import("@sentry/nextjs");

let sentry: SentryModule | null = null;

/**
 * Error monitoring. Does nothing until SENTRY_DSN is set; the SDK is only
 * loaded in that case, so it costs nothing otherwise.
 */
export async function register() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn || process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    sentry = await import("@sentry/nextjs");
    sentry.init({
      dsn,
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
      // Errors only: no performance tracing, and no request bodies or
      // personal details attached to events.
      tracesSampleRate: 0,
      sendDefaultPii: false,
    });

    // Picked up by reportError() in src/server/report-error.ts.
    (
      globalThis as {
        __SENTRY_CAPTURE__?: (error: unknown, context: string) => void;
      }
    ).__SENTRY_CAPTURE__ = (error, context) => {
      sentry?.captureException(error, { tags: { context } });
      // Handled errors (a failed email, a webhook problem) are captured
      // outside the request-error hook, so nothing else sends them before a
      // serverless function is frozen. Keep it alive until they are sent.
      try {
        after(() => sentry?.flush(2000));
      } catch {
        // Not inside a request: start the flush and move on.
        void sentry?.flush(2000);
      }
    };
  } catch (error) {
    // Monitoring must never stop the site from starting.
    console.error("[error] sentry.init", error);
    sentry = null;
  }
}

/** Reports errors thrown while rendering pages or running Server Actions. */
export const onRequestError: Instrumentation.onRequestError = (
  error,
  request,
  context,
) => {
  sentry?.captureRequestError(error, request, context);
};
