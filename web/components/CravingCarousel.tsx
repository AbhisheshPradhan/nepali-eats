import Link from "next/link";
import Image from "next/image";
import { Carousel } from "@/components/Carousel";
import { tagLabel } from "@/lib/format";
import { foodImage, type FoodImage } from "@/lib/food";

const HUES = [18, 35, 350, 168, 4, 45, 205, 120, 28];

// Each tile shows a category's hero from categories/<tag>/cover.<ext> (resolved
// by foodImage). The gradient sits behind the image while it loads. Images crop
// to the 4:3 tile standard. Tags whose category has no cover image are skipped
// entirely (no gradient-only fallback tiles).
function CravingTile({
	tag,
	src,
	alt,
	hue,
}: {
	tag: string;
	src: string;
	alt: string;
	hue: number;
}) {
	const label = tagLabel(tag);
	const href = tag === "momo" ? "/momo" : `/nepali-food/${tag}`;
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
				<Image
					src={src}
					alt={alt}
					fill
					sizes="230px"
					className="object-cover transition-transform duration-500 group-hover:scale-105"
				/>
			</div>
			<div className="mt-2.5 font-display font-semibold text-[1.1rem] text-ink-900 capitalize">
				{label}
			</div>
		</Link>
	);
}

export function CravingCarousel({ tags }: { tags: string[] }) {
	const withImage = tags
		.map((tag) => ({ tag, img: foodImage(tag) }))
		.filter((t): t is { tag: string; img: FoodImage } => Boolean(t.img));
	if (withImage.length === 0) return null;
	return (
		<Carousel
			eyebrow="Eat by craving"
			eyebrowClassName="text-himalaya-700"
			title="What are you hungry for?"
			trackClassName="gap-[18px] px-2 pt-1 pb-2.5"
		>
			{withImage.map(({ tag, img }, i) => (
				<CravingTile
					key={tag}
					tag={tag}
					src={img.src}
					alt={img.alt}
					hue={HUES[i % HUES.length]}
				/>
			))}
		</Carousel>
	);
}
