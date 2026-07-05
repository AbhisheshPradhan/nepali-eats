import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/Badge";
import { StoryImage } from "@/components/StoryImage";
import { STORIES, formatStoryDate } from "@/lib/stories";

// Homepage stories strip: the newest post as a wide feature card, the next two
// as compact cards. Self-hides when there are no stories, grows on its own as
// posts land in lib/stories.ts.
export function HomeStories() {
	if (STORIES.length === 0) return null;
	const [latest, ...rest] = STORIES;
	const more = rest.slice(0, 2);

	return (
		<section className="max-w-[1180px] mx-auto px-4 sm:px-6 pt-14">
			<div className="flex items-end justify-between gap-4 flex-wrap">
				<div>
					<span className="eyebrow text-himalaya-700">Stories</span>
					<h2 className="font-display font-extrabold text-[1.6rem] text-ink-900 mt-1">
						Something to read while the momo steams
					</h2>
				</div>
				<Link
					href="/stories"
					className="inline-flex items-center gap-1.5 text-chili-600 font-display font-semibold hover:text-chili-700 transition-colors pb-1"
				>
					All stories
					<ArrowRight size={16} />
				</Link>
			</div>

			<Link
				href={`/stories/${latest.slug}`}
				className="grid md:grid-cols-[1.1fr_1fr] bg-white rounded-xl overflow-hidden shadow-md group mt-4"
			>
				<StoryImage
					hue={latest.hue}
					src={latest.heroImage}
					alt={latest.title}
					className="min-h-[220px]"
					iconSize={44}
					sizes="(max-width: 768px) 100vw, 560px"
				/>
				<div className="p-7 flex flex-col justify-center gap-3">
					<div>
						<Badge
							tone="marigold"
							solid
						>
							{latest.category}
						</Badge>
					</div>
					<h3 className="font-display font-extrabold text-[1.55rem] leading-tight text-ink-900 group-hover:text-chili-600 transition-colors">
						{latest.title}
					</h3>
					<p className="text-ink-700 leading-relaxed">{latest.dek}</p>
					<div className="flex items-center gap-2 text-ink-500 text-[0.9rem]">
						<span className="font-semibold text-ink-700">
							{latest.author}
						</span>
						<span>·</span>
						<span>{formatStoryDate(latest.date)}</span>
						<span>·</span>
						<span>{latest.readTime}</span>
					</div>
				</div>
			</Link>

			{more.length > 0 && (
				<div className="grid sm:grid-cols-2 gap-5 mt-5">
					{more.map((p) => (
						<Link
							key={p.slug}
							href={`/stories/${p.slug}`}
							className="bg-white rounded-lg overflow-hidden shadow-sm flex flex-col group hover:shadow-lg hover:-translate-y-1 transition"
						>
							<StoryImage
								hue={p.hue}
								src={p.heroImage}
								alt={p.title}
								className="h-[160px]"
								sizes="(max-width: 640px) 100vw, 560px"
							/>
							<div className="p-5 flex flex-col gap-2 flex-1">
								<div>
									<Badge tone="himalaya">{p.category}</Badge>
								</div>
								<h3 className="font-display font-bold text-[1.2rem] leading-tight text-ink-900 group-hover:text-chili-600 transition-colors">
									{p.title}
								</h3>
								<div className="flex items-center gap-2 text-ink-500 text-[0.85rem] mt-auto">
									<span>{formatStoryDate(p.date)}</span>
									<span>·</span>
									<span>{p.readTime}</span>
								</div>
							</div>
						</Link>
					))}
				</div>
			)}
		</section>
	);
}
