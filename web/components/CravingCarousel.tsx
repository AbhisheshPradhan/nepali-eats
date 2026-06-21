"use client";
import Link from "next/link";
import { Cookie } from "@phosphor-icons/react";
import { Carousel } from "@/components/Carousel";

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
	return (
		<Carousel
			eyebrow="Eat by craving"
			eyebrowClassName="text-himalaya-700"
			title="What are you hungry for?"
			trackClassName="gap-[18px] px-2 pt-1 pb-2.5"
		>
			{tags.map((t, i) => {
				const h = HUES[i % HUES.length];
				const href =
					t === "momo"
						? "/momo"
						: `/explore?tag=${encodeURIComponent(t)}`;
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
							<Cookie
								size={40}
								weight="fill"
							/>
						</div>
						<div className="mt-2.5 font-display font-semibold text-[1.1rem] text-ink-900 capitalize">
							{LABELS[t] || t}
						</div>
					</Link>
				);
			})}
		</Carousel>
	);
}
