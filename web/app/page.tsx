import Image from "next/image";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Bunting } from "@/components/Bunting";
import { HeroSearch } from "@/components/HeroSearch";
import { CravingCarousel } from "@/components/CravingCarousel";
import { StateRow } from "@/components/StateRow";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
	featuredByState,
	popularByState,
	tagFacets,
	totalCount,
} from "@/lib/queries";
import { metroFromState } from "@/lib/format";
import { resolveState } from "@/lib/geo";

export default async function HomePage() {
	// Featured is state-scoped. Resolve the visitor's state (admin override cookie
	// -> IP geo -> NSW fallback), same as Explore.
	const state = await resolveState();

	const [gems, popular, tags, total] = await Promise.all([
		featuredByState(state, 5),
		popularByState(state, 5),
		tagFacets(),
		totalCount(),
	]);

	// Round down to the nearest 50 so the headline stat stays clean and only
	// ever climbs ("550+", then "600+"), never showing an awkward live number.
	const countLabel = `${Math.floor(total / 50) * 50}+`;

	const metro = metroFromState(state);

	return (
		<div>
			{/* HERO */}
			<section className="relative z-20 bg-[radial-gradient(1200px_500px_at_50%_-10%,var(--color-marigold-100),var(--color-paper-50))]">
				<div className="max-w-[760px] mx-auto px-4 sm:px-6 pb-4 sm:pb-6 sm:pt-7 text-center">
					<Bunting />
					<span className="eyebrow text-chili-500 text-[12px] sm:text-[0.9rem]">
						{countLabel} restaurants, food trucks and caterers
					</span>
					<h1 className="text-[clamp(2.4rem,5.2vw,3.6rem)] leading-[1.02] text-ink-900 mt-2">
						Find authentic{" "}
						<span className="text-chili-500">Nepali </span>food{" "}
						across Australia{" "}
					</h1>
					{/* <p className="text-[1.15rem] text-ink-700 max-w-[560px] mx-auto mt-2.5 leading-snug">
						From hole-in-the-wall steamers to Sunday market stalls,
						real Nepali food from every corner of Australia.
					</p> */}
					<HeroSearch />
				</div>
			</section>

			{/* FEATURED + POPULAR (each self-hides when the state has no picks) */}
			<StateRow
				kind="featured"
				items={gems}
				state={state}
				metro={metro}
			/>
			<StateRow
				kind="popular"
				items={popular}
				state={state}
				metro={metro}
			/>

			{/* CRAVING CAROUSEL */}
			<section className="max-w-[1180px] mx-auto px-4 sm:px-6 pb-6">
				<CravingCarousel tags={tags.map((t) => t.value)} />
			</section>

			{/* STORY STRIP */}
			<section className="max-w-[1180px] mx-auto px-4 sm:px-6 pt-14">
				<div className="bg-ink-900 rounded-xl p-11 flex gap-8 items-center flex-wrap relative overflow-hidden">
					<div className="flex-[1_1_320px]">
						<Badge
							tone="marigold"
							solid
						>
							Our story
						</Badge>
						<h3 className="text-[2rem] text-white mt-3.5 mb-2.5">
							Nepali food is having a moment. We didn&apos;t want
							to miss a single plate.
						</h3>
						<p className="text-paper-200 text-[1.1rem] leading-relaxed mb-5">
							NepaliEats started as a group chat of friends
							swapping momo tips. Now it&apos;s a map of every
							Nepali kitchen, cafe and truck in Australia, added
							by people who actually eat there.
						</p>
						<Button
							href="/stories"
							variant="secondary"
							iconRight={<ArrowRight size={18} />}
						>
							Read the story
						</Button>
					</div>
					<div className="flex-[0_0_200px] grid place-items-center">
						<Image
							src="/logo-momo.svg"
							alt=""
							width={160}
							height={160}
							className="opacity-95"
						/>
					</div>
				</div>
			</section>
		</div>
	);
}
