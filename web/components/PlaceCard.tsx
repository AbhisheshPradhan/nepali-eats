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

export function PlaceCard({
  r,
  distance,
  className,
}: {
  r: Restaurant;
  distance?: string;
  className?: string;
}) {
  const img = mediaUrl(r.primaryPhoto);
  const price = priceString(r);
  const open = isOpenNow(r.openingHours);
  const hoursLine = todayHoursLine(r.openingHours);
  const hue = hueFromId(r.id);
  const location = [r.suburb, r.state].filter(Boolean).join(", ");

  return (
    <Link
      href={`/restaurant/${r.slug}`}
      className={cn(
        "group flex flex-col bg-white rounded-lg overflow-hidden shadow-md transition",
        "hover:shadow-lg hover:-translate-y-1",
        className
      )}
    >
      {/* image */}
      <div
        className="relative aspect-[4/3] overflow-hidden"
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
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <VenueIcon type={r.venueType} size={56} className="text-white/70" />
          </div>
        )}

        {/* top row */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          {open !== null ? (
            <Badge tone={open ? "open" : "closed"} solid>
              {open ? "Open now" : "Closed"}
            </Badge>
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
      <div className="flex flex-col gap-2.5 p-4 pt-4 flex-1">
        <div className="flex justify-between items-baseline gap-2.5">
          <h3 className="font-display font-bold text-[1.3rem] text-ink-900 leading-tight">
            {r.name}
          </h3>
          {price && (
            <span className="text-ink-500 font-semibold whitespace-nowrap">
              {price}
            </span>
          )}
        </div>

        {r.rating != null && (
          <Rating value={r.rating} count={r.reviewCount} size={16} />
        )}

        {location && (
          <div className="flex items-center gap-1.5 text-ink-500 text-[0.95rem]">
            <MapPin className="text-chili-500" size={16} weight="fill" />
            <span>
              {location}
              {distance ? ` · ${distance}` : ""}
            </span>
          </div>
        )}

        {hoursLine && (
          <div
            className={cn(
              "flex items-center gap-1.5 text-[0.95rem] font-semibold",
              open ? "text-coriander-700" : "text-ink-500"
            )}
          >
            <Clock size={16} className={open ? "text-coriander-500" : "text-ink-500"} />
            <span>{hoursLine}</span>
          </div>
        )}

        {r.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-0.5">
            {r.tags.slice(0, 3).map((c) => (
              <Tag key={c} className="text-[0.8rem] px-[11px] py-1 capitalize">
                {c}
              </Tag>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
