import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

// Public-site buttons: large targets (48px+), high contrast, one clear style
// per level of emphasis.
export const buttonStyles = cva(
  "inline-flex items-center justify-center gap-2.5 rounded-2xl text-center font-bold leading-tight transition-colors duration-150 disabled:pointer-events-none disabled:opacity-60 [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-forest-700 text-white shadow-soft hover:bg-forest-900",
        secondary:
          "border-2 border-forest-700 bg-white text-forest-900 hover:bg-forest-100",
        honey: "bg-honey text-forest-950 shadow-soft hover:bg-[#d99b47]",
        onDark: "bg-cream-50 text-forest-900 hover:bg-white",
        outlineOnDark:
          "border-2 border-cream-50/70 text-cream-50 hover:bg-cream-50/10",
      },
      size: {
        md: "min-h-12 px-5 py-2.5 text-base",
        lg: "min-h-14 px-7 py-3 text-lg",
      },
    },
    defaultVariants: { variant: "primary", size: "lg" },
  },
);

type ButtonStyleProps = VariantProps<typeof buttonStyles>;

/** Internal, locale-aware link styled as a button. */
export function ButtonLink({
  className,
  variant,
  size,
  ...props
}: ComponentProps<typeof Link> & ButtonStyleProps) {
  return (
    <Link className={cn(buttonStyles({ variant, size }), className)} {...props} />
  );
}

/** Plain anchor (tel:, sms:, mailto:, external) styled as a button. */
export function ButtonAnchor({
  className,
  variant,
  size,
  ...props
}: ComponentProps<"a"> & ButtonStyleProps) {
  return <a className={cn(buttonStyles({ variant, size }), className)} {...props} />;
}
