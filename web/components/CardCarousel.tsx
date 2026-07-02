"use client";
import { useState } from "react";
import Image from "next/image";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/cn";

// Photo carousel for the image slot of a card (currently the Explore map popup).
// Clickable arrows + dots + touch swipe. Sits inside a <Link>, so the controls
// stopPropagation/preventDefault to avoid triggering the card's navigation.
export function CardCarousel({
	photos,
	alt,
	logoFirst = false,
}: {
	photos: string[];
	alt: string;
	// when true, the first slide is a brand logo: shown contained on a light
	// background rather than cropped like a photo.
	logoFirst?: boolean;
}) {
	const urls = photos
		.map((k) => mediaUrl(k))
		.filter((u): u is string => !!u);
	const [i, setI] = useState(0);
	const [touchX, setTouchX] = useState<number | null>(null);
	const n = urls.length;

	const go = (delta: number, e?: React.MouseEvent) => {
		e?.preventDefault();
		e?.stopPropagation();
		setI((prev) => (prev + delta + n) % n);
	};

	if (n === 0) return null;

	return (
		<div
			className="absolute inset-0"
			onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
			onTouchEnd={(e) => {
				if (touchX == null) return;
				const dx = e.changedTouches[0].clientX - touchX;
				if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
				setTouchX(null);
			}}
		>
			{urls.map((url, idx) => {
				const isLogo = logoFirst && idx === 0;
				return (
					<div
						key={url}
						className={cn(
							"absolute inset-0 transition-opacity duration-300",
							isLogo && "bg-white",
							idx === i ? "opacity-100" : "opacity-0",
						)}
					>
						<Image
							src={url}
							alt={alt}
							fill
							sizes="360px"
							className={isLogo ? "object-contain p-6" : "object-cover"}
						/>
					</div>
				);
			})}

			<button
				type="button"
				aria-label="Previous photo"
				onClick={(e) => go(-1, e)}
				className="absolute left-2 top-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center rounded-full bg-ink-900/55 text-white hover:bg-ink-900/80 cursor-pointer"
			>
				<CaretLeft size={15} weight="bold" />
			</button>
			<button
				type="button"
				aria-label="Next photo"
				onClick={(e) => go(1, e)}
				className="absolute right-2 top-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center rounded-full bg-ink-900/55 text-white hover:bg-ink-900/80 cursor-pointer"
			>
				<CaretRight size={15} weight="bold" />
			</button>

			<div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
				{urls.map((_, idx) => (
					<span
						key={idx}
						className={cn(
							"h-1.5 w-1.5 rounded-full transition-colors",
							idx === i ? "bg-white" : "bg-white/50",
						)}
					/>
				))}
			</div>
		</div>
	);
}
