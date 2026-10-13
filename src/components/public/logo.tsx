import { BRAND_COLORS, BRAND_MARK } from "@/lib/brand";
import { cn } from "@/lib/utils";

type Tone = "dark" | "light";

/** The symbol on its own. `tone="light"` is for dark backgrounds. */
export function LogoMark({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: Tone;
}) {
  return (
    <svg
      viewBox={BRAND_MARK.viewBox}
      fill="none"
      aria-hidden="true"
      className={cn("size-[2.9rem] shrink-0", className)}
    >
      <g
        stroke={tone === "light" ? BRAND_COLORS.cream : BRAND_COLORS.forest}
        strokeWidth={BRAND_MARK.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={BRAND_MARK.roof} />
        <path d={BRAND_MARK.letter} />
      </g>
      <path d={BRAND_MARK.heart} fill={BRAND_COLORS.honey} />
    </svg>
  );
}

/** Symbol plus wordmark set in the site's own fonts. */
export function Logo({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: Tone;
}) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <LogoMark tone={tone} />
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
