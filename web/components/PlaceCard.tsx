"use client";
import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin, MapTrifold } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/Badge";
import { Rating } from "@/components/ui/Rating";
import { VenueIcon } from "@/components/ui/VenueIcon";
import type { Restaurant } from "@/lib/types";
import { mediaUrl } from "@/lib/media";
import { isOpenNow, openStatus, hueFromId } from "@/lib/format";
import { cn } from "@/lib/cn";

// The card only needs these fields, so both a full Restaurant and a map pin
// (RestaurantPin + openingHours) can be passed.
export type PlaceCardData = Pick<
  Restaurant,
  | "id"
  | "slug"
  | "name"
  | "venueType"
  | "rating"
  | "reviewCount"
  | "suburb"
  | "state"
  | "primaryPhoto"
  | "openingHours"
> & {
  // optional: map-popup pins don't carry it, only full restaurant rows do
  isFeatured?: boolean;
};

// One card, two layouts:
//   "card" — vertical (homepage featured, listings, map popup)
//   "row"  — horizontal (Explore list); adds hover/selected highlight + opens
//            in a new tab. Both modes show the same details.
export function PlaceCard({
  r,
  distance,
  className,
  href,
  variant = "card",
  selected = false,
  hovered = false,
  onHover,
  newTab,
  noHover = false,
  hideState = false,
  onViewMap,
}: {
  r: PlaceCardData;
  distance?: string;
  className?: string;
  href?: string;
  variant?: "card" | "row";
  selected?: boolean;
  hovered?: boolean;
  onHover?: (id: number | null) => void;
  newTab?: boolean;
  // drop the lift-on-hover effect (used for the static map popup card)
  noHover?: boolean;
  // show only the suburb (no ", STATE"), e.g. homepage featured cards
  hideState?: boolean;
  // when set, renders a "View on map" button (Explore list) that centres the map
  // on this spot instead of navigating to the detail page
  onViewMap?: () => void;
}) {
  const row = variant === "row";
  // Row cards always open in a new tab; other cards opt in via `newTab`.
  const openNewTab = newTab ?? row;
  const img = mediaUrl(r.primaryPhoto);
  const open = isOpenNow(r.openingHours, r.state);
  const status = openStatus(r.openingHours, r.state);
  const hue = hueFromId(r.id);
  const location = [r.suburb, hideState ? null : r.state].filter(Boolean).join(", ");
  const hi = hovered || selected;
  const featured = !!r.isFeatured;

  const card = (
    <Link
      href={href ?? `/restaurant/${r.slug}`}
      {...(openNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onMouseEnter={onHover ? () => onHover(r.id) : undefined}
      onMouseLeave={onHover ? () => onHover(null) : undefined}
      className={cn(
        "group bg-white overflow-hidden rounded-lg transition",
        row
          ? cn(
              "flex flex-col sm:flex-row border-2",
              selected ? "bg-paper-100" : "bg-white",
              hi
                ? "border-chili-500 shadow-md"
                : featured
                  ? "border-chili-500 shadow-sm"
                  : "border-paper-300 shadow-sm"
            )
          : cn(
              "flex flex-col shadow-md",
              featured && "border-2 border-chili-500",
              !noHover && "hover:shadow-lg hover:-translate-y-1"
            ),
        className
      )}
    >
      {/* image */}
      <div
        className={cn(
          "relative overflow-hidden",
          row
            ? "w-full h-[180px] shrink-0 sm:w-[210px] sm:h-auto sm:min-h-[190px] sm:self-stretch"
            : "aspect-[4/3]"
        )}
        style={{
          background: `linear-gradient(135deg, hsl(${hue} 90% 62%), hsl(${(hue + 24) % 360} 85% 55%))`,
        }}
      >
        {img ? (
          <Image
            src={img}
            alt={r.name}
            fill
            sizes="(max-width: 768px) 100vw, 360px"
            className={cn(
              "object-cover",
              !row && !noHover && "transition-transform duration-500 group-hover:scale-105"
            )}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <VenueIcon type={r.venueType} size={56} className="text-white/70" />
          </div>
        )}

        {/* open / closed badge */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          {open !== null ? (
            open ? (
              <Badge tone="open" solid>
                Open now
              </Badge>
            ) : (
              <Badge tone="neutral" solid className="bg-ink-300 text-white">
                Closed
              </Badge>
            )
          ) : (
            <span />
          )}
        </div>

        {/* venue type chip */}
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 bg-ink-900/80 text-white text-[0.78rem] font-bold px-2.5 py-1 rounded-full">
          <VenueIcon type={r.venueType} size={13} />
          {r.venueType || "Restaurant"}
        </span>
      </div>

      {/* body */}
      <div className="flex flex-col gap-2.5 p-4 flex-1 min-w-0">
        <h3 className="font-display font-bold text-[18px] text-ink-900 leading-tight truncate min-w-0">
          {r.name}
        </h3>

        {r.rating != null && (
          <Rating value={r.rating} count={r.reviewCount} size={16} />
        )}

        {location && (
          <div className="flex items-center gap-1.5 text-ink-500 text-[0.95rem] min-w-0">
            <MapPin className="text-chili-500 shrink-0" size={16} weight="fill" />
            {/* Distance is the valuable bit, so pin it (shrink-0) and let the
                suburb,state truncate instead, e.g. "Upper Mount Gra… · 4.2 km". */}
            <span className="truncate min-w-0">{location}</span>
            {distance && (
              <span className="shrink-0 whitespace-nowrap">· {distance}</span>
            )}
          </div>
        )}

        {/* Opening-hours status (replaces the old tag row).
            TODO: opening_hours is not populated yet (hours enrichment is
            deferred), so openStatus() returns null and this line stays hidden.
            Backfill opening_hours from the Google place page (same render path
            as enrich-google.js) to light this up, e.g.
            "Open now · closes at 10pm" or "Opens 3pm tomorrow". */}
        {/* Opening-hours status line hidden for now (re-enable by dropping `false &&`) */}
        {false && status && (
          <div
            className={cn(
              "mt-auto flex items-center gap-1.5 text-[0.95rem] font-semibold",
              status?.open ? "text-coriander-700" : "text-ink-500"
            )}
          >
            <Clock
              size={16}
              className={status?.open ? "text-coriander-500" : "text-ink-500"}
            />
            <span>{status?.label}</span>
          </div>
        )}

        {onViewMap && (
          <button
            type="button"
            onClick={(e) => {
              // sits inside the card's <Link>; don't navigate, just move the map
              e.preventDefault();
              e.stopPropagation();
              onViewMap();
            }}
            className="mt-auto self-start inline-flex items-center gap-1.5 rounded-full border-2 border-chili-500 text-chili-600 font-display font-bold text-[0.85rem] px-3 py-1 transition-colors hover:bg-chili-500 hover:text-white cursor-pointer"
          >
            <MapTrifold size={15} weight="fill" />
            View on map
          </button>
        )}
      </div>
    </Link>
  );

  if (!featured) return card;

  // Featured: the "tab" pokes above the card's top edge, so it lives on a
  // relative wrapper (the card itself clips with overflow-hidden).
  return (
    <div className="relative">
      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 inline-flex items-center bg-chili-500 text-white font-body font-bold text-[0.78rem] tracking-[0.02em] px-3 py-1 rounded-full shadow-sm whitespace-nowrap">
        Featured
      </span>
      {card}
    </div>
  );
}
