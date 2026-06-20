import { cn } from "@/lib/cn";

export function Rating({
  value,
  count = null,
  size = 16,
  showValue = true,
  className,
}: {
  value: number;
  count?: number | null;
  size?: number;
  showValue?: boolean;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(1, value / 5)) * 100;
  return (
    <span
      className={cn("inline-flex items-center gap-2 font-body", className)}
      aria-label={`${value.toFixed(1)} out of 5${count != null ? `, ${count} reviews` : ""}`}
    >
      <span
        className="relative inline-block leading-none"
        style={{ fontSize: `${size}px` }}
        aria-hidden
      >
        <span className="text-paper-300">★★★★★</span>
        <span
          className="absolute left-0 top-0 overflow-hidden whitespace-nowrap text-marigold-500"
          style={{ width: `${pct}%` }}
        >
          ★★★★★
        </span>
      </span>
      {showValue && (
        <span
          className="font-bold text-ink-900"
          style={{ fontSize: `${size * 0.85}px` }}
        >
          {value.toFixed(1)}
        </span>
      )}
      {count != null && (
        <span className="text-ink-500" style={{ fontSize: `${size * 0.75}px` }}>
          ({count})
        </span>
      )}
    </span>
  );
}
