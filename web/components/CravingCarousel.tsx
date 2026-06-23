"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Cookie } from "@phosphor-icons/react";
import { Carousel } from "@/components/Carousel";

const HUES = [18, 35, 350, 168, 4, 45, 205, 120, 28];
const LABELS: Record<string, string> = {
	momo: "Momo",
	newari: "Newari",
	thakali: "Thakali",
	tibetan: "Tibetan",
	vegetarian: "Veg-friendly",
	"indian-nepali": "Nepali-Indian",
};

// Each tile shows a curated category image from /public/cravings/<tag>.webp.
// If a file is missing, it falls back to the brand gradient + icon (the gradient
// always sits behind the image). Images crop to the 4:3 tile standard.
function CravingTile({ tag, hue }: { tag: string; hue: number }) {
	const [hasImage, setHasImage] = useState(true);
	const label = LABELS[tag] || tag;
	const href =
		tag === "momo" ? "/momo" : `/explore?tag=${encodeURIComponent(tag)}`;
	return (
		<Link
			href={href}
			className="shrink-0 w-[230px] snap-start cursor-pointer group"
		>
			<div
				className="relative aspect-[4/3] rounded-lg overflow-hidden grid place-items-center text-white/85 shadow-sm transition-transform group-hover:-translate-y-1"
				style={{
					background: `linear-gradient(135deg, hsl(${hue} 78% 62%), hsl(${(hue + 32) % 360} 76% 50%))`,
				}}
			>
				{hasImage ? (
					<Image
						src={`/cravings/${tag}.jpg`}
						alt={label}
						fill
						sizes="230px"
						className="object-cover transition-transform duration-500 group-hover:scale-105"
						onError={() => setHasImage(false)}
					/>
				) : (
					<Cookie
						size={40}
						weight="fill"
					/>
				)}
			</div>
			<div className="mt-2.5 font-display font-semibold text-[1.1rem] text-ink-900 capitalize">
				{label}
			</div>
		</Link>
	);
}

export function CravingCarousel({ tags }: { tags: string[] }) {
	return (
		<Carousel
			eyebrow="Eat by craving"
			eyebrowClassName="text-himalaya-700"
			title="What are you hungry for?"
			trackClassName="gap-[18px] px-2 pt-1 pb-2.5"
		>
			{tags.map((t, i) => (
				<CravingTile
					key={t}
					tag={t}
					hue={HUES[i % HUES.length]}
				/>
			))}
		</Carousel>
	);
}
