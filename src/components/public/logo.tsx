import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={cn("size-11 shrink-0", className)}
    >
      <rect width="48" height="48" rx="14" fill="#2F5D43" />
      <path
        d="M10.5 24.5 24 12.5l13.5 12"
        stroke="#FBF8F1"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.5 22.5V33a3 3 0 0 0 3 3h13a3 3 0 0 0 3-3V22.5"
        stroke="#FBF8F1"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 32.6c-3.5-2.3-5.1-4.1-5.1-6.1a2.65 2.65 0 0 1 5.1-1 2.65 2.65 0 0 1 5.1 1c0 2-1.6 3.8-5.1 6.1Z"
        fill="#E3A857"
      />
    </svg>
  );
}

/** Symbol plus wordmark set in the site's own fonts. */
export function Logo({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-[1.6rem] font-bold tracking-tight",
            tone === "light" ? "text-cream-50" : "text-forest-900",
          )}
        >
          Mabel
        </span>{" "}
        <span
          className={cn(
            "mt-1 text-[0.7rem] font-bold tracking-[0.2em] uppercase",
            tone === "light" ? "text-forest-300" : "text-forest-700",
          )}
        >
          Home Help
        </span>
      </span>
    </span>
  );
}
