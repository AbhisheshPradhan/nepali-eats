"use client";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Clock } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/Badge";
import { Tag } from "@/components/ui/Tag";
import { Rating } from "@/components/ui/Rating";
import { VenueIcon } from "@/components/ui/VenueIcon";
import type { Restaurant } from "@/lib/types";
import { mediaUrl } from "@/lib/media";
import { priceString, isOpenNow, todayHoursLine, hueFromId } from "@/lib/format";
import { cn } from "@/lib/cn";

export function CompactRow({
  r,
  hovered,
  selected,
  onHover,
  distance,
}: {
  r: Restaurant;
  hovered: boolean;
  selected: boolean;
  onHover: (id: number | null) => void;
  distance?: string;
}) {
  const hi = hovered || selected;
  const img = mediaUrl(r.primaryPhoto);
  const open = isOpenNow(r.openingHours);
  const hours = todayHoursLine(r.openingHours);
  const price = priceString(r);
  const hue = hueFromId(r.id);

  return (
    <Link
      href={`/restaurant/${r.slug}`}
      onMouseEnter={() => onHover(r.id)}
      onMouseLeave={() => onHover(null)}
      className={cn(
        "flex flex-col sm:flex-row overflow-hidden rounded-lg border-2 transition",
        selected ? "bg-paper-100" : "bg-white",
        hi ? "border-chili-500 shadow-md" : "border-paper-300 shadow-sm"
      )}
    >
      <div
        className="relative shrink-0 w-full h-[180px] sm:w-[210px] sm:h-auto sm:min-h-[190px] sm:self-stretch"
        style={{
          background: `linear-gradient(135deg, hsl(${hue} 80% 62%), hsl(${(hue + 28) % 360} 78% 52%))`,
        }}
      >
        {img ? (
          <Image src={img} alt={r.name} fill sizes="230px" className="object-cover" />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <VenueIcon type={r.venueType} size={44} className="text-white/70" />
          </div>
        )}
        {open !== null && (
          <span className="absolute top-2.5 left-2.5">
            <Badge tone={open ? "open" : "closed"} solid className="text-[0.66rem] px-2.5 py-[3px]">
              {open ? "Open" : "Closed"}
            </Badge>
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 p-3.5 px-4.5 flex flex-col gap-1.5">
        <div className="flex justify-between gap-2 items-baseline">
          <h3 className="font-display font-bold text-[1.3rem] text-ink-900 leading-tight">
            {r.name}
          </h3>
          {price && (
            <span className="text-ink-500 font-semibold shrink-0">{price}</span>
          )}
        </div>
        {r.rating != null && <Rating value={r.rating} count={r.reviewCount} size={15} />}
        <div className="flex items-center gap-1.5 text-ink-500 text-[0.9rem]">
          <MapPin className="text-chili-500" size={15} weight="fill" />
          <span>
            {[r.suburb, r.state].filter(Boolean).join(", ")}
            {distance ? ` · ${distance}` : ""}
          </span>
        </div>
        {hours && (
          <div
            className={cn(
              "flex items-center gap-1.5 text-[0.9rem] font-semibold",
              open ? "text-coriander-700" : "text-ink-500"
            )}
          >
            <Clock size={15} className={open ? "text-coriander-500" : "text-ink-500"} />
            <span>{hours}</span>
          </div>
        )}
        {r.tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mt-0.5">
            {r.tags.slice(0, 3).map((c) => (
              <Tag key={c} className="text-[0.74rem] px-2.5 py-[3px] capitalize">
                {c}
              </Tag>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
