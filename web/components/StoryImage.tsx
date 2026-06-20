import { ForkKnife } from "@phosphor-icons/react/dist/ssr";

export function StoryImage({
  hue,
  className,
  iconSize = 40,
}: {
  hue: number;
  className?: string;
  iconSize?: number;
}) {
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
