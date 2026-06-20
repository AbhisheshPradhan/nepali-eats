import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { StoryImage } from "@/components/StoryImage";
import { STORIES } from "@/lib/stories";

export const metadata: Metadata = {
  title: "Stories from the Nepali table",
  description:
    "City guides, dish explainers and the people behind the Nepali kitchens we love across Australia.",
  alternates: { canonical: "/stories" },
};

export default function StoriesPage() {
  const [featured, ...rest] = STORIES;
  return (
    <div className="max-w-[1180px] mx-auto px-6 pt-10">
      <span className="eyebrow text-chili-500">Stories</span>
      <h1 className="text-[2.6rem] text-ink-900 mt-1.5 mb-1">
        Tales from the Nepali table
      </h1>
      <p className="text-ink-500 mb-8 text-[1.15rem] max-w-[620px]">
        City guides, dish explainers and the people behind the kitchens we love.
      </p>

      <Link
        href={`/stories/${featured.slug}`}
        className="grid md:grid-cols-[1.2fr_1fr] gap-7 bg-white rounded-xl overflow-hidden shadow-md mb-10 group"
      >
        <StoryImage hue={featured.hue} className="min-h-[240px]" iconSize={48} />
        <div className="p-8 md:pl-0 flex flex-col justify-center">
          <div className="mb-3">
            <Badge tone="favourite" solid>
              {featured.category}
            </Badge>
          </div>
          <h2 className="text-[2rem] leading-tight text-ink-900 mb-3 group-hover:text-chili-600 transition-colors">
            {featured.title}
          </h2>
          <p className="text-ink-700 text-[1.1rem] leading-relaxed mb-4.5">
            {featured.dek}
          </p>
          <div className="flex items-center gap-2.5 text-ink-500 text-[0.92rem]">
            <span className="font-semibold text-ink-700">{featured.author}</span>
            <span>·</span>
            <span>{featured.date}</span>
            <span>·</span>
            <span>{featured.readTime}</span>
          </div>
        </div>
      </Link>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6 pb-2">
        {rest.map((p) => (
          <Link
            key={p.slug}
            href={`/stories/${p.slug}`}
            className="bg-white rounded-lg overflow-hidden shadow-sm flex flex-col group hover:shadow-lg hover:-translate-y-1 transition"
          >
            <StoryImage hue={p.hue} className="h-[170px]" />
            <div className="p-5 flex flex-col gap-2.5 flex-1">
              <div>
                <Badge tone="info">{p.category}</Badge>
              </div>
              <h3 className="font-display font-bold text-[1.3rem] leading-tight text-ink-900">
                {p.title}
              </h3>
              <p className="text-ink-700 leading-snug flex-1">{p.dek}</p>
              <div className="flex items-center gap-2 text-ink-500 text-[0.85rem]">
                <span>{p.date}</span>
                <span>·</span>
                <span>{p.readTime}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
