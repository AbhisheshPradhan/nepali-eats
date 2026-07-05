import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Bunting } from "@/components/Bunting";
import { HeroSearch } from "@/components/HeroSearch";
import { CravingCarousel } from "@/components/CravingCarousel";
import { HomeStories } from "@/components/HomeStories";
import { StateRow } from "@/components/StateRow";
import { MomoHotspots } from "@/components/MomoHotspots";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
	featuredByState,
	popularByState,
	suburbFacets,
	tagFacets,
	totalCount,
} from "@/lib/queries";
import { metroFromState } from "@/lib/format";
import { resolveState } from "@/lib/geo";

// The first-timer's order, step by step. Copy owned by the copy lead; dish
// spellings follow the house glossary (choila, achaar, timur).
const FIRST_PLATE: { title: string; body: string; cta: string; href: string }[] =
	[
		{
			title: "Start with momo",
			body: "Steamed first, achaar on the side. One plate tells you everything about a kitchen.",
			cta: "Find great momo",
			href: "/momo",
		},
		{
			title: "Then the full set",
			body: "Thakali dal bhat: black dal, rice, gundruk and refills until you tap out.",
			cta: "See the Thakali kitchens",
			href: "/nepali-food/thakali",
		},
		{
			title: "Go past the dumplings",
			body: "Smoky choila, charred sekuwa, a big bowl of thukpa. The menu runs deeper than momo.",
			cta: "Meet the rest of the menu",
			href: "/nepali-food",
		},
	];

export default async function HomePage() {
	// Featured is state-scoped. Resolve the visitor's state (admin override cookie
	// -> IP geo -> NSW fallback), same as Explore.
	const state = await resolveState();

	const [gems, popular, tags, total, suburbs] = await Promise.all([
		featuredByState(state, 5),
		popularByState(state, 5),
		tagFacets(),
		totalCount(),
		suburbFacets(),
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
						Find Authentic{" "}
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

			{/* LATEST STORIES (self-hides when lib/stories.ts is empty) */}
			<HomeStories />

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

			{/* FIRST PLATE — the order we give first-timers, linking the dish hubs */}
			<section className="max-w-[1180px] mx-auto px-4 sm:px-6 pt-14">
				<span className="eyebrow text-marigold-700">Start here</span>
				<h2 className="font-display font-extrabold text-[1.6rem] text-ink-900 mt-1 mb-1.5">
					Never eaten Nepali before?
				</h2>
				<p className="text-ink-700 mb-6 max-w-[640px]">
					Lucky you, the first plate only happens once. This is the
					order we give friends we are converting.
				</p>
				<div className="grid sm:grid-cols-3 gap-5">
					{FIRST_PLATE.map((step, i) => (
						<Link
							key={step.href}
							href={step.href}
							className="bg-white rounded-xl shadow-sm p-6 group hover:shadow-md hover:-translate-y-1 transition"
						>
							<span className="inline-grid place-items-center w-9 h-9 rounded-full bg-chili-100 text-chili-600 font-display font-extrabold text-[1.05rem]">
								{i + 1}
							</span>
							<h3 className="font-display font-bold text-[1.25rem] text-ink-900 mt-3 group-hover:text-chili-600 transition-colors">
								{step.title}
							</h3>
							<p className="text-ink-700 mt-1.5 leading-snug">
								{step.body}
							</p>
							<span className="inline-flex items-center gap-1.5 text-chili-600 font-display font-semibold mt-3.5">
								{step.cta}
								<ArrowRight size={16} />
							</span>
						</Link>
					))}
				</div>
			</section>

			{/* SUBURB HOTSPOTS — in-content links to the suburb landing pages
			    (states/dishes/cuisines live in the footer; no duplication) */}
			<MomoHotspots suburbs={suburbs} />
		</div>
	);
}
