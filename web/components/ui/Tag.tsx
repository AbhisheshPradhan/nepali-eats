import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Tag({
  children,
  active = false,
  className,
}: {
  children: ReactNode;
  active?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-body font-semibold text-[0.9rem] px-3.5 py-1.5 rounded-full border-[1.5px] transition-colors",
        active
          ? "text-white bg-chili-500 border-chili-500"
          : "text-ink-700 bg-white border-sand-400",
        className
      )}
    >
      {children}
    </span>
  );
}
