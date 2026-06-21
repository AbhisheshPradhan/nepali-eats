import Image from "next/image";
import { ForkKnife } from "@phosphor-icons/react/dist/ssr";

export function StoryImage({
  hue,
  src,
  alt,
  className,
  iconSize = 40,
  sizes = "(max-width: 768px) 100vw, 760px",
}: {
  hue: number;
  src?: string;
  alt?: string;
  className?: string;
  iconSize?: number;
  sizes?: string;
}) {
  if (src) {
    return (
      <div className={`relative overflow-hidden ${className || ""}`}>
        <Image
          src={src}
          alt={alt || ""}
          fill
          sizes={sizes}
          className="object-cover"
        />
      </div>
    );
  }
  return (
    <div
      className={`grid place-items-center text-white/85 ${className || ""}`}
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 78% 62%), hsl(${(hue + 34) % 360} 76% 50%))`,
      }}
      aria-hidden
    >
      <ForkKnife size={iconSize} weight="fill" />
    </div>
  );
}
