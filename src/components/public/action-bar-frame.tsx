"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** Pages that are themselves the action: the bar would only be in the way. */
function isActionPage(pathname: string): boolean {
  return pathname === "/book" || pathname.startsWith("/membership");
}

/**
 * Keeps the phone action bar out of the way. It slides off while the visitor
 * scrolls down to read or types in a form, and while the page's own Call,
 * Text and Book buttons are on screen (the home page opens with them); it
 * comes back as soon as they scroll up. The links stay in the page
 * throughout, so keyboard and screen reader users can always reach them
 * (focusing one brings the bar back).
 */
export function ActionBarFrame({
  label,
  floating,
  children,
}: {
  label: string;
  /** A single small button in the corner instead of a full-width bar. */
  floating: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [scrolledAway, setScrolledAway] = useState(false);
  const [typing, setTyping] = useState(false);
  // Whether the page's own buttons are on screen, as last measured for a
  // given page. Until a page has been measured, assume they are only on the
  // home page, which opens with them: no flash of the bar on first load.
  const [twins, setTwins] = useState<{ pathname: string; visible: boolean } | null>(
    null,
  );
  const twinVisible = twins?.pathname === pathname ? twins.visible : pathname === "/";

  useEffect(() => {
    let last = Math.max(0, window.scrollY);
    let queued = false;

    function update() {
      queued = false;
      const current = Math.max(0, window.scrollY);
      const delta = current - last;
      // Ignore jitter (and the bounce at the ends of the page on iOS).
      if (Math.abs(delta) < 12) return;
      setScrolledAway(delta > 0 && current > 160);
      last = current;
    }

    function onScroll() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    }

    // The on-screen keyboard leaves little room: step aside while typing.
    function onFocusIn(event: FocusEvent) {
      const target = event.target as HTMLElement | null;
      setTyping(Boolean(target?.closest("input, textarea, select")));
    }
    function onFocusOut() {
      setTyping(false);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  // Watch the page's own button groups (ContactActions). They differ from
  // page to page, so this starts again after every navigation.
  useEffect(() => {
    const onScreen = new Set<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) onScreen.add(entry.target);
          else onScreen.delete(entry.target);
        }
        setTwins({ pathname, visible: onScreen.size > 0 });
      },
      { threshold: 0.35 },
    );
    document
      .querySelectorAll("[data-contact-actions]")
      .forEach((group) => observer.observe(group));
    return () => observer.disconnect();
  }, [pathname]);

  if (isActionPage(pathname)) return null;

  const hidden = scrolledAway || typing || twinVisible;

  return (
    <nav
      aria-label={label}
      data-hidden={hidden ? "true" : undefined}
      // Tabbing into the bar while it is tucked away brings it back.
      onFocus={() => {
        setScrolledAway(false);
        setTwins({ pathname, visible: false });
      }}
      className={cn(
        "fixed bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-40 motion-safe:transition-transform motion-safe:duration-300 lg:hidden print:hidden",
        floating
          ? "right-3"
          : "inset-x-2 mx-auto max-w-md rounded-2xl border border-cream-300 bg-cream-50/95 p-1.5 shadow-[0_8px_28px_rgb(31_61_43/0.18)] backdrop-blur",
        // Far enough to clear the gap below it, including the iPhone home bar.
        hidden && "translate-y-[calc(100%+env(safe-area-inset-bottom)+1rem)]",
      )}
    >
      {children}
    </nav>
  );
}
