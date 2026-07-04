import Link from "next/link";
import { cuisineLinks, STATE_CODES, STATE_LINK_NAME } from "@/lib/landing";
import { suburbSlug } from "@/lib/format";

// The busiest Nepali suburbs (suburbFacets order). Hardcoded because the footer
// sits under a client boundary (SiteFooter); the ranking shifts slowly, so
// refresh this list occasionally rather than plumb a query through the layout.
const HOTSPOTS: { suburb: string; state: string }[] = [
	{ suburb: "Auburn", state: "NSW" },
	{ suburb: "Rockdale", state: "NSW" },
	{ suburb: "Melbourne", state: "VIC" },
	{ suburb: "Hurstville", state: "NSW" },
	{ suburb: "Sydney", state: "NSW" },
	{ suburb: "Glenroy", state: "VIC" },
];

const FLAGS = [
	"bg-flag-blue",
	"bg-flag-white",
	"bg-flag-red",
	"bg-flag-green",
	"bg-flag-yellow",
];

function Col({
	title,
	items,
}: {
	title: string;
	items: { label: string; href: string }[];
}) {
	return (
		<div className="flex flex-col gap-2">
			<div className="font-display font-bold text-white mb-1">
				{title}
			</div>
			{items.map((i) => (
				<Link
					key={i.label}
					href={i.href}
					className="text-paper-200 text-[0.95rem] hover:text-white transition-colors"
				>
					{i.label}
				</Link>
			))}
		</div>
	);
}

export function Footer({
	clearMobileActionBar = false,
}: {
	clearMobileActionBar?: boolean;
}) {
	return (
		<footer className="bg-ink-900 text-white mt-16">
			<div
				className="flex h-2.5"
				aria-hidden
			>
				{Array.from({ length: 30 }).map((_, i) => (
					<div
						key={i}
						className={`flex-1 ${FLAGS[i % 5]}`}
					/>
				))}
			</div>
			<div className="max-w-[1180px] mx-auto px-4 sm:px-6 pt-12 pb-9 flex gap-12 flex-wrap">
				<div className="max-w-[320px]">
					<div className="mb-3">
						<span className="font-display font-extrabold text-[1.35rem]">
							<span className="text-marigold-500">Nepali</span>
							<span className="text-white">Eats</span>
						</span>
					</div>
					<p className="text-paper-200 leading-relaxed m-0">
						Every plate of Nepali food in Australia, gathered with
						love, from busy dining rooms to food-truck queues.
					</p>
				</div>
				<div className="flex gap-12 flex-wrap">
					<Col
						title="By state"
						items={STATE_CODES.map((c) => ({
							label: STATE_LINK_NAME[c] ?? c,
							href: `/nepali-restaurants/${c.toLowerCase()}`,
						}))}
					/>
					<Col
						title="By dish"
						items={[
							// A spread, not just momo preparations (the derived
							// list is momo-first); the hub page carries the rest.
							{ label: "Momo", href: "/momo" },
							{ label: "Jhol momo", href: "/nepali-food/jhol-momo" },
							{ label: "Choila", href: "/nepali-food/choila" },
							{ label: "Sekuwa", href: "/nepali-food/sekuwa" },
							{ label: "Dal bhat", href: "/nepali-food/dal-bhat" },
							{ label: "Thukpa", href: "/nepali-food/thukpa" },
							{ label: "All dishes", href: "/nepali-food" },
						]}
					/>
					<Col
						title="By cuisine"
						items={cuisineLinks().links}
					/>
					<Col
						title="Momo hotspots"
						items={HOTSPOTS.map((h) => ({
							label: `${h.suburb}, ${h.state}`,
							href: `/nepali-restaurants/${suburbSlug(h.suburb, h.state)}`,
						}))}
					/>
					<Col
						title="NepaliEats"
						items={[
							// Post-launch: { label: "Add a spot", href: "/add-a-spot" },
							{ label: "Explore the map", href: "/explore" },
							{
								label: "Food trucks",
								href: "/explore?venue=Food+Truck",
							},
							{ label: "Our story", href: "/stories" },
							{ label: "About", href: "/about" },
							// Post-launch: { label: "For owners", href: "/add-a-spot" },
						]}
					/>
				</div>
			</div>
			<div
				className={`border-t border-white/10 pt-[18px] px-4 sm:px-6 text-center text-paper-200 text-[0.85rem] ${
					clearMobileActionBar
						? "pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-[18px]"
						: "pb-[18px]"
				}`}
			>
				Made with love for Nepali food in Australia · © 2026 NepaliEats ·{" "}
					<Link href="/about" className="hover:text-white transition-colors">
						About
					</Link>{" "}
					·{" "}
					<Link href="/privacy" className="hover:text-white transition-colors">
						Privacy
					</Link>{" "}
					·{" "}
					<Link href="/terms" className="hover:text-white transition-colors">
						Terms
					</Link>{" "}
					·{" "}
					<Link
						href="/disclaimer"
						className="hover:text-white transition-colors"
					>
						Disclaimer
					</Link>
				</div>
		</footer>
	);
}
