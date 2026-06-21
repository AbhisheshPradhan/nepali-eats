import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary: "bg-chili-500 text-white hover:bg-chili-600 hover:shadow-pop",
  secondary: "bg-marigold-500 text-ink-900 hover:bg-marigold-600 hover:shadow-md",
  outline:
    "bg-transparent text-chili-500 border-2 border-chili-500 hover:bg-chili-100",
  ghost:
    "bg-transparent text-ink-700 border-2 border-transparent hover:bg-paper-200",
};

const SIZE: Record<Size, string> = {
  sm: "px-4 py-2 text-[0.9375rem] gap-1.5",
  md: "px-[22px] py-3 text-[1.0625rem] gap-2",
  lg: "px-[30px] py-4 text-[1.2rem] gap-2.5",
};

interface ButtonProps {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  pill?: boolean;
  block?: boolean;
  className?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  href?: string;
  newTab?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  "aria-label"?: string;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  pill = true,
  block = false,
  className,
  iconLeft,
  iconRight,
  href,
  newTab,
  ...rest
}: ButtonProps) {
  const cls = cn(
    "inline-flex items-center justify-center font-display font-bold leading-none tracking-[0.005em] cursor-pointer select-none border-2 border-transparent",
    "transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
    pill ? "rounded-full" : "rounded-md",
    SIZE[size],
    VARIANT[variant],
    block && "w-full",
    className
  );
  const inner = (
    <>
      {iconLeft}
      {children}
      {iconRight}
    </>
  );
  if (href) {
    return (
      <Link
        href={href}
        className={cls}
        aria-label={rest["aria-label"]}
        {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {inner}
      </Link>
    );
  }
  return (
    <button className={cls} {...rest}>
      {inner}
    </button>
  );
}
