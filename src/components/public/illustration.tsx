import Image from "next/image";

/** One of the project's own SVG illustrations (public/illustrations). */
export function Illustration({
  name,
  alt = "",
  width,
  height,
  className,
  priority = false,
}: {
  name: string;
  /** Leave empty for decorative art so screen readers skip it. */
  alt?: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={`/illustrations/${name}.svg`}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      // SVGs are already resolution independent.
      unoptimized
    />
  );
}
