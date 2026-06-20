"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Plus, List, X, User } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/explore", label: "Explore" },
  { href: "/stories", label: "Stories" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-30 bg-paper-50/90 backdrop-blur-md border-b border-paper-300">
      <div className="w-full flex items-center gap-6 py-2 pl-3 pr-6">
        <Link href="/" className="flex items-center gap-2.5 cursor-pointer">
          <Image src="/logo-momo.svg" alt="" width={40} height={40} priority />
          <span className="font-display font-extrabold text-2xl tracking-[-0.02em]">
            <span className="text-chili-500">Nepali</span>
            <span className="text-ink-900">Eats</span>
          </span>
        </Link>

        <nav className="hidden min-[880px]:flex items-center gap-[18px] ml-2">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "font-display font-semibold text-[1.02rem] px-1 py-1.5 border-b-[3px] transition-colors",
                isActive(n.href)
                  ? "text-chili-500 border-chili-500"
                  : "text-ink-700 border-transparent hover:text-chili-500"
              )}
            >
              {n.label}
            </Link>
          ))}
          <Button
            href="/add-a-spot"
            size="sm"
            iconLeft={<Plus weight="bold" size={16} />}
            className="ml-3"
          >
            Add a spot
          </Button>
        </nav>

        <div className="flex-1" />

        <div className="hidden min-[880px]:block">
          <Button href="/add-a-spot" size="sm" variant="outline" iconLeft={<User size={16} />}>
            Log in
          </Button>
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
          aria-expanded={open}
          className={cn(
            "min-[880px]:hidden inline-flex items-center justify-center w-11 h-11 rounded-md border-2 border-ink-900 cursor-pointer shrink-0 text-[1.4rem]",
            open ? "bg-ink-900 text-white" : "bg-transparent text-ink-900"
          )}
        >
          {open ? <X /> : <List />}
        </button>
      </div>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 top-[57px] bg-ink-900/35 z-[25] min-[880px]:hidden"
          />
          <div className="absolute left-0 right-0 top-full bg-paper-50 border-b border-paper-300 shadow-lg px-4 pt-3 pb-[18px] flex flex-col gap-1.5 z-[26] min-[880px]:hidden">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "font-display font-bold text-[1.15rem] px-4 py-3.5 rounded-md",
                  isActive(n.href)
                    ? "text-chili-500 bg-paper-100"
                    : "text-ink-900"
                )}
              >
                {n.label}
              </Link>
            ))}
            <div className="mt-1.5 flex flex-col gap-2">
              <Button href="/add-a-spot" block iconLeft={<Plus weight="bold" size={16} />}>
                Add a spot
              </Button>
              <Button href="/add-a-spot" block variant="outline" iconLeft={<User size={16} />}>
                Log in
              </Button>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
