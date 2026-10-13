"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-xl border border-danger bg-danger-soft p-6"
    >
      <h1 className="text-2xl font-bold text-danger">This screen could not load</h1>
      <p className="max-w-xl text-ink">
        Nothing was changed. Try again; if it keeps happening, note the time and
        the reference below for your developer.
      </p>
      {error.digest ? (
        <p className="text-sm text-ink-muted">Reference: {error.digest}</p>
      ) : null}
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
