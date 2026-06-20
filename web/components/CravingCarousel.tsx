"use client";
import Link from "next/link";
import { useRef } from "react";
import { CaretLeft, CaretRight, Cookie } from "@phosphor-icons/react";

const HUES = [18, 35, 350, 168, 4, 45, 205, 120, 28];
const LABELS: Record<string, string> = {
  momo: "Momo",
  "indian-nepali": "Nepali-Indian",
  tibetan: "Tibetan",
  newari: "Newari",
  vegetarian: "Veg-friendly",
  thakali: "Thakali",
};

export function CravingCarousel({ tags }: { tags: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) =>
    ref.current?.scrollBy({ left: dir * 360, behavior: "smooth" });

  return (
    <div>
      <div className="flex items-end justify-between mb-[18px] gap-2">
        <div>
          <span className="eyebrow text-himalaya-700">Eat by craving</span>
          <h2 className="text-[2.2rem] text-ink-900 mt-1">What are you hungry for?</h2>
        </div>
        <div className="flex gap-2.5 shrink-0">
          {[
            { icon: <CaretLeft size={20} />, dir: -1, label: "Previous" },
            { icon: <CaretRight size={20} />, dir: 1, label: "Next" },
          ].map((b) => (
            <button
              key={b.label}
              onClick={() => scroll(b.dir)}
              aria-label={b.label}
              className="w-11 h-11 rounded-full border-2 border-ink-900 bg-white text-ink-900 inline-flex items-center justify-center cursor-pointer transition-colors hover:bg-ink-900 hover:text-white"
            >
              {b.icon}
            </button>
          ))}
        </div>
      </div>
      <div
        ref={ref}
        className="flex gap-[18px] overflow-x-auto scrollbar-hide snap-x snap-mandatory px-2 pt-1 pb-2.5"
      >
        {tags.map((t, i) => {
          const h = HUES[i % HUES.length];
          const href = t === "momo" ? "/momo" : `/explore?tag=${encodeURIComponent(t)}`;
          return (
            <Link
              key={t}
              href={href}
              className="shrink-0 w-[230px] snap-start cursor-pointer group"
            >
              <div
                className="h-[170px] rounded-lg grid place-items-center text-white/85 shadow-sm transition-transform group-hover:-translate-y-1"
                style={{
                  background: `linear-gradient(135deg, hsl(${h} 78% 62%), hsl(${(h + 32) % 360} 76% 50%))`,
                }}
              >
                <Cookie size={40} weight="fill" />
              </div>
              <div className="mt-2.5 font-display font-semibold text-[1.1rem] text-ink-900 capitalize">
                {LABELS[t] || t}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
