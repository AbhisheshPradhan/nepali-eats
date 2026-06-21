import Image from "next/image";
import { mediaUrl } from "@/lib/media";
import { hueFromId, initials } from "@/lib/format";
import { cn } from "@/lib/cn";

// A restaurant's "profile mark": the uploaded logo if present, otherwise a
// monogram on a white tile (so every place looks intentional even before a logo
// is added). Always a white rounded tile so it reads cleanly over a food photo
// or a coloured card. Used for the detail-page header and the card placeholder.
export function Avatar({
  name,
  logoKey,
  id,
  size = 96,
  ring = false,
  className,
}: {
  name: string;
  logoKey: string | null | undefined;
  id: number;
  size?: number;
  ring?: boolean;
  className?: string;
}) {
  const url = mediaUrl(logoKey);
  const hue = hueFromId(id);
  return (
    <div
      className={cn(
        "relative shrink-0 grid place-items-center overflow-hidden rounded-full bg-white",
        ring && "ring-4 ring-white shadow-md",
        className
      )}
      style={{ width: size, height: size }}
    >
      {url ? (
        <Image
          src={url}
          alt={`${name} logo`}
          fill
          unoptimized
          sizes={`${size}px`}
          className="object-cover"
        />
      ) : (
        <span
          className="font-display font-extrabold leading-none"
          style={{ color: `hsl(${hue} 65% 45%)`, fontSize: Math.round(size * 0.4) }}
        >
          {initials(name)}
        </span>
      )}
    </div>
  );
}
