/**
 * Single place errors are reported from server code. Logs always; forwards to
 * Sentry when the SDK has been initialised (see src/instrumentation.ts).
 */
export function reportError(error: unknown, context: string): void {
  console.error(`[error] ${context}`, error);

  const sentry = (
    globalThis as {
      __SENTRY_CAPTURE__?: (error: unknown, context: string) => void;
    }
  ).__SENTRY_CAPTURE__;
  if (sentry) {
    try {
      sentry(error, context);
    } catch {
      // Reporting must never throw.
    }
  }
}
