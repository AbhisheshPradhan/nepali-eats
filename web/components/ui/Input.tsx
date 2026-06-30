import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Input({
  iconLeft,
  wrapClassName,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  iconLeft?: ReactNode;
  wrapClassName?: string;
}) {
  return (
    <div
      className={cn(
        "input-group flex items-center gap-2.5 bg-white border-2 border-sand-400 rounded-full px-4 h-[46px] transition-shadow transition-colors",
        wrapClassName,
      )}
    >
      {iconLeft && (
        <span className="text-ink-500 flex text-[1.2em]" aria-hidden>
          {iconLeft}
        </span>
      )}
      <input
        className={cn(
          "flex-1 bg-transparent outline-none font-body text-[1.0625rem] text-ink-900 min-w-0 placeholder:text-ink-500",
          className
        )}
        {...props}
      />
    </div>
  );
}
