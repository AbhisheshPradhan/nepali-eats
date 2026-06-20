import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Bunting } from "@/components/Bunting";
import { HeroSearch } from "@/components/HeroSearch";
import { CravingCarousel } from "@/components/CravingCarousel";
import { PlaceCard } from "@/components/PlaceCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { featured, tagFacets, totalCount } from "@/lib/queries";

export const revalidate = 3600;

export default async function HomePage() {
  const [gems, tags, total] = await Promise.all([
    featured(6),
    tagFacets(),
    totalCount(),
  ]);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-[radial-gradient(1200px_500px_at_50%_-10%,var(--color-marigold-100),var(--color-paper-50))]">
        <div className="max-w-[760px] mx-auto px-6 pt-14 pb-10 text-center">
          <Bunting />
          <span className="eyebrow text-chili-500">All across Australia</span>
          <h1 className="text-[clamp(2.6rem,6vw,4.25rem)] leading-[1.02] text-ink-900 mt-3">
            Find your
            <br />
            <span className="text-chili-500">momo people.</span>
          </h1>
          <p className="text-[1.25rem] text-ink-700 max-w-[560px] mx-auto mt-[18px] leading-[1.5]">
            From hole-in-the-wall steamers to Sunday market stalls, every hidden
            gem serving real Nepali food, gathered in one happy place.
          </p>
          <HeroSearch />
        </div>
      </section>

      {/* FEATURED */}
      <section className="max-w-[1180px] mx-auto px-6 pt-11">
        <div className="flex items-end justify-between mb-5 flex-wrap gap-2">
          <div>
            <span className="eyebrow text-marigold-700">Local favourites</span>
            <h2 className="text-[2.2rem] text-ink-900 mt-1">
              This week&apos;s hidden gems
            </h2>
          </div>
          <Button
            href="/explore"
            variant="ghost"
            iconRight={<ArrowRight size={18} />}
          >
            See all {total} spots
          </Button>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
          {gems.map((r) => (
            <PlaceCard key={r.id} r={r} />
          ))}
        </div>
      </section>

      {/* CRAVING CAROUSEL */}
      <section className="max-w-[1180px] mx-auto px-6 mt-10">
        <CravingCarousel tags={tags.map((t) => t.value)} />
      </section>

      {/* STORY STRIP */}
      <section className="max-w-[1180px] mx-auto px-6 pt-14">
        <div className="bg-ink-900 rounded-xl p-11 flex gap-8 items-center flex-wrap relative overflow-hidden">
          <div className="flex-[1_1_320px]">
            <Badge tone="favourite" solid>
              Our story
            </Badge>
            <h3 className="text-[2rem] text-white mt-3.5 mb-2.5">
              Nepali food is having a moment. We didn&apos;t want to miss a
              single plate.
            </h3>
            <p className="text-paper-200 text-[1.1rem] leading-relaxed mb-5">
              NepaliEats started as a group chat of friends swapping momo tips.
              Now it&apos;s a map of every kitchen, cafe and truck worth the trip,
              added by people who actually eat there.
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
