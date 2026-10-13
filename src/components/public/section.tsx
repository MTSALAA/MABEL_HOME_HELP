import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const tones = {
  cream: "bg-cream-50",
  white: "bg-white",
  sand: "bg-cream-100",
  tint: "bg-forest-50",
  green: "bg-forest-900 text-cream-50",
} as const;

export function Section({
  tone = "cream",
  className,
  children,
  ...props
}: {
  tone?: keyof typeof tones;
  className?: string;
  children: ReactNode;
} & React.ComponentProps<"section">) {
  return (
    <section className={cn(tones[tone], "py-16 md:py-24", className)} {...props}>
      <div className="page-container">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "left",
  as: Heading = "h2",
  id,
  onDark = false,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  align?: "left" | "center";
  as?: "h1" | "h2";
  id?: string;
  onDark?: boolean;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
      )}
    >
      {eyebrow ? (
        <p
          className={cn(
            "mb-3 text-base font-bold tracking-[0.12em] uppercase",
            onDark ? "text-honey" : "text-forest-700",
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <Heading
        id={id}
        className={cn(
          "font-bold tracking-tight",
          Heading === "h1"
            ? "text-[2.5rem] leading-[1.1] md:text-6xl"
            : "text-[2rem] leading-[1.15] md:text-[2.75rem]",
          onDark ? "text-cream-50" : "text-forest-900",
        )}
      >
        {title}
      </Heading>
      {lead ? (
        <p
          className={cn(
            "mt-4 text-xl leading-relaxed",
            onDark ? "text-cream-50/90" : "text-ink-muted",
          )}
        >
          {lead}
        </p>
      ) : null}
    </div>
  );
}

/** Title block at the top of every inner page. */
export function PageHero({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: string;
  children?: ReactNode;
}) {
  return (
    <div className="border-b border-cream-300 bg-cream-100">
      <div className="page-container py-12 md:py-16">
        <SectionHeading as="h1" title={title} lead={lead} />
        {children}
      </div>
    </div>
  );
}
