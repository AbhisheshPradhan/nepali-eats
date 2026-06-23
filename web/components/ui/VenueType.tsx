import { cn } from "@/lib/cn";
import { VenueIcon } from "@/components/ui/VenueIcon";
import type { VenueType as VenueTypeValue } from "@/lib/types";

// Venue-type label with its matching icon (Restaurant/Café/Takeaway/…).
// Shared by the place cards and the restaurant detail header so the styling
// stays in one place.
export function VenueType({
  type,
  iconSize = 13,
  className,
}: {
  type?: VenueTypeValue | string | null;
  iconSize?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-ink-700 text-[0.78rem] font-bold",
        className
      )}
    >
      <VenueIcon type={type} size={iconSize} />
      {type || "Restaurant"}
    </span>
  );
}
