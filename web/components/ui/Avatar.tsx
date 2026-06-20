import { cn } from "@/lib/cn";

export function Avatar({
  name = "",
  size = 44,
  className,
}: {
  name?: string;
  size?: number;
  className?: string;
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 bg-marigold-300 text-ink-900 font-display font-bold",
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden
    >
      {initials || "·"}
    </span>
  );
}
