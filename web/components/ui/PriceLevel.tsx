import { cn } from "@/lib/cn";

// Price-level indicator: four "$" signs with the ones up to `level` filled in
// (ink-700) and the rest dimmed (ink-300). Renders nothing when level is 0/null.
export function PriceLevel({
  level,
  className,
}: {
  level?: number | null;
  className?: string;
}) {
  if (!level || level <= 0) return null;
  return (
    <span
      className={cn("font-semibold tracking-tight shrink-0", className)}
    >
      {[1, 2, 3, 4].map((n) => (
        <span key={n} className={n <= level ? "text-ink-700" : "text-ink-300"}>
          $
        </span>
      ))}
    </span>
  );
}
