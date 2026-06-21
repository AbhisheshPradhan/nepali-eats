import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Bunting } from "@/components/Bunting";
import { HeroSearch } from "@/components/HeroSearch";
import { CravingCarousel } from "@/components/CravingCarousel";
import { FeaturedCards } from "@/components/FeaturedCards";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { headers } from "next/headers";
import { featuredByState, tagFacets } from "@/lib/queries";
import { capitalLatLng, metroFromState, STATE_CAPITAL } from "@/lib/format";

export default async function HomePage() {
  // Featured is state-scoped. Detect the visitor's state from IP (like Explore),
  // defaulting to NSW / Sydney 2000 for non-AU or undetected visitors.
  const h = await headers();
  const detected =
    h.get("x-vercel-ip-country") === "AU"
      ? (h.get("x-vercel-ip-country-region") || "").toUpperCase()
      : "";
  const state = detected in STATE_CAPITAL ? detected : "NSW";

  const [gems, tags] = await Promise.all([
    featuredByState(state, 5),
    tagFacets(),
  ]);

  // Default "you are here" for distances = the state capital, until the visitor
  // shares their real location.
  const defaultLoc = capitalLatLng(state);
  const metro = metroFromState(state);

  return (
    <div>
      {/* HERO */}
      <section className="relative z-20 bg-[radial-gradient(1200px_500px_at_50%_-10%,var(--color-marigold-100),var(--color-paper-50))]">
        <div className="max-w-[760px] mx-auto px-6 pt-7 pb-6 text-center">
          <Bunting />
          <span className="eyebrow text-chili-500">All across Australia</span>
          <h1 className="text-[clamp(2.4rem,5.2vw,3.6rem)] leading-[1.02] text-ink-900 mt-2">
            Find your <span className="text-chili-500">momo people.</span>
          </h1>
          <p className="text-[1.15rem] text-ink-700 max-w-[560px] mx-auto mt-2.5 leading-snug">
            From hole-in-the-wall steamers to Sunday market stalls, real Nepali
            food from every corner of Australia.
          </p>
          <HeroSearch />
        </div>
      </section>

      {/* FEATURED */}
      <section className="max-w-[1180px] mx-auto px-6 pt-5">
        <div className="flex items-end justify-between mb-5 flex-wrap gap-2">
          <div>
            <span className="eyebrow text-marigold-700">Local favourites</span>
            <h2 className="text-[2.2rem] text-ink-900 mt-1">
              Where {metro}&apos;s eating this week
            </h2>
          </div>
          <Button
            href="/explore"
            variant="ghost"
            iconRight={<ArrowRight size={18} />}
          >
            View All
          </Button>
        </div>
        <FeaturedCards gems={gems} fallbackLoc={defaultLoc} />
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
              Now it&apos;s a map of every Nepali kitchen, cafe and truck in
              Australia, added by people who actually eat there.
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
