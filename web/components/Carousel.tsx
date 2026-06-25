"use client";
import { useRef, type ReactNode } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";

// Shared horizontal carousel: an eyebrow + title header with prev/next arrows
// on the top-right, above a scroll-snapping track. Cards go in as children;
// `trackClassName` controls the track's gap/padding so each use can keep its
// own card spacing. Extracted from CravingCarousel and reused by FeaturedCards.
export function Carousel({
	eyebrow,
	eyebrowClassName = "",
	title,
	children,
	trackClassName = "",
	scrollBy = 360,
}: {
	eyebrow: string;
	eyebrowClassName?: string;
	title: ReactNode;
	children: ReactNode;
	trackClassName?: string;
	scrollBy?: number;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const scroll = (dir: number) =>
		ref.current?.scrollBy({ left: dir * scrollBy, behavior: "smooth" });

	return (
		<div>
			<div className="flex items-end justify-between mb-3 sm:mb-4.5 gap-2">
				<div>
					<span className={`eyebrow ${eyebrowClassName}`}>
						{eyebrow}
					</span>
					<h2 className="text-[1.4rem] sm:text-[2.2rem] text-ink-900 mt-1">
						{title}
					</h2>
				</div>
				<div className="gap-2.5 shrink-0 hidden sm:flex">
					{[
						{
							icon: <CaretLeft size={20} />,
							dir: -1,
							label: "Previous",
						},
						{
							icon: <CaretRight size={20} />,
							dir: 1,
							label: "Next",
						},
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
				className={`flex overflow-x-auto scrollbar-hide snap-x snap-mandatory ${trackClassName}`}
			>
				{children}
			</div>
		</div>
	);
}
