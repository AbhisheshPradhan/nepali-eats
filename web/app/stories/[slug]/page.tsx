import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/Badge";
import { Tag } from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import { StoryImage } from "@/components/StoryImage";
import { StoryBody } from "@/components/StoryBody";
import { STORIES, getStory, formatStoryDate, storyFaq } from "@/lib/stories";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://nepalieats.com.au";

export function generateStaticParams() {
	return STORIES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const { slug } = await params;
	const s = getStory(slug);
	if (!s) return { title: "Story not found" };
	return {
		title: s.title,
		description: s.dek,
		keywords: s.tags,
		alternates: { canonical: `/stories/${s.slug}` },
		openGraph: {
			title: s.title,
			description: s.dek,
			type: "article",
			...(s.heroImage ? { images: [{ url: s.heroImage }] } : {}),
		},
	};
}

export default async function StoryPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const s = getStory(slug);
	if (!s) notFound();

	const faq = storyFaq(s);
	const stripLinks = (t: string) => t.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

	const jsonLd = {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "Article",
				headline: s.title,
				description: s.dek,
				author: { "@type": "Organization", name: s.author },
				datePublished: s.date,
				dateModified: s.date,
				articleSection: s.category,
				keywords: s.tags.join(", "),
				mainEntityOfPage: `${SITE}/stories/${s.slug}`,
				...(s.heroImage
					? {
							image: s.heroImage.startsWith("http")
								? s.heroImage
								: `${SITE}${s.heroImage}`,
						}
					: {}),
				publisher: {
					"@type": "Organization",
					name: "NepaliEats",
					logo: {
						"@type": "ImageObject",
						url: `${SITE}/logo-momo.svg`,
					},
				},
			},
			...(faq.length
				? [
						{
							"@type": "FAQPage",
							mainEntity: faq.map((f) => ({
								"@type": "Question",
								name: f.q,
								acceptedAnswer: {
									"@type": "Answer",
									text: stripLinks(f.a),
								},
							})),
						},
					]
				: []),
		],
	};

	return (
		<div className="max-w-[760px] mx-auto px-4 sm:px-6 pt-6">
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
			<Link
				href="/stories"
				className="inline-flex items-center gap-1.5 text-ink-700 font-display font-bold mb-4.5 hover:text-chili-500"
			>
				<ArrowLeft size={18} /> All stories
			</Link>
			<div className="mb-3.5">
				<Badge
					tone="favourite"
					solid
				>
					{s.category}
				</Badge>
			</div>
			<h1 className="text-[2.8rem] leading-[1.05] text-ink-900 mb-3.5">
				{s.title}
			</h1>
			<div className="flex items-center gap-2.5 text-ink-500 text-[0.95rem] mb-6">
				<span className="font-semibold text-ink-700">{s.author}</span>
				<span>·</span>
				<span>{formatStoryDate(s.date)}</span>
				<span>·</span>
				<span>{s.readTime}</span>
			</div>
			<StoryImage
				hue={s.hue}
				src={s.heroImage}
				alt={s.title}
				className="h-[320px] rounded-xl"
				iconSize={48}
			/>
			<p className="text-[1.4rem] leading-[1.5] text-ink-900 font-medium mt-7 mb-5">
				{s.dek}
			</p>
			<StoryBody blocks={s.body} />

			{s.tags.length > 0 && (
				<div className="flex flex-wrap gap-2 mt-9">
					{s.tags.map((t) => (
						<Tag key={t}>{t}</Tag>
					))}
				</div>
			)}

			<div className="mt-8 p-7 bg-ink-900 rounded-xl text-center">
				<h2 className="text-[1.6rem] text-white mb-3.5">Hungry yet?</h2>
				<Button
					href="/explore"
					variant="secondary"
					iconRight={<ArrowRight size={18} />}
				>
					Find these spots on the map
				</Button>
			</div>
		</div>
	);
}
