"use client";

import { Analytics as VercelAnalytics } from "@vercel/analytics/next";

/**
 * Cookieless page-view analytics. Query strings are dropped before anything
 * is sent: they can hold a one-time membership link or a checkout reference,
 * and the page path is all the statistics need.
 */
export function Analytics() {
  return (
    <VercelAnalytics
      beforeSend={(event) => ({ ...event, url: event.url.split("?")[0] })}
    />
  );
}
