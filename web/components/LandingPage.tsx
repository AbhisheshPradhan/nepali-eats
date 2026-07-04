import Link from "next/link";
import Image from "next/image";
import {
  MapTrifold,
  ForkKnife,
  ArrowRight,
} from "@phosphor-icons/react/dist/ssr";
import { PlaceCard } from "@/components/PlaceCard";
import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { renderInline, stripInline } from "@/components/inline";
import type { Restaurant } from "@/lib/types";
import type { LandingContent, LandingGroup } from "@/lib/landing";
import type { FoodImage } from "@/lib/food";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://nepalieats.com.au";

const GRID = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6";

// Cards on dish pages carry matched menu-item names, shown as pills.
type LandingRestaurant = Restaurant & { matches?: string[] };

export function LandingPage({
  content,
  restaurants,
  groups,
  groupLabel = "spots",
  total,
  heroImage,
  gallery,
}: {
  content: LandingContent;
  restaurants: LandingRestaurant[];
  // Curated dish hub (e.g. /momo): render top spots grouped by state instead of
  // one flat grid.
  groups?: LandingGroup[];
  groupLabel?: string;
  // Directory pages pass the true count so a capped grid can link to the rest.
  total?: number;
  // Registry-driven imagery (falls back to no hero / no gallery when absent).
  heroImage?: FoodImage;
  gallery?: FoodImage[];
}) {
  const {
    breadcrumbs,
    eyebrow,
    title,
    intro,
    whatToOrder,
    faq,
    crossLinks,
    exploreHref,
    collectionName,
  } = content;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: c.label,
          item: `${SITE}${c.href}`,
        })),
      },
      {
        "@type": "CollectionPage",
        name: collectionName,
        description: intro[0] ? stripInline(intro[0]) : collectionName,
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: restaurants.length,
          itemListElement: restaurants.slice(0, 25).map((r, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${SITE}/restaurant/${r.slug}`,
            name: r.name,
          })),
        },
      },
      ...(faq && faq.length
        ? [
            {
              "@type": "FAQPage",
              mainEntity: faq.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: stripInline(f.a),
                },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <div className="max-w-[1180px] mx-auto px-4 sm:px-6 pt-6 pb-4">
      {/* Escape `<` so any field containing `</script>` can't break out of the
          JSON-LD block (JSON.stringify does not escape it). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <Breadcrumbs trail={breadcrumbs} />

      {heroImage && (
        <div className="relative aspect-[16/7] w-full rounded-xl overflow-hidden mb-6 bg-paper-200">
          <Image
            src={heroImage.src}
            alt={heroImage.alt}
            fill
            priority
            sizes="(max-width: 1180px) 100vw, 1180px"
            className="object-cover"
          />
        </div>
      )}

      <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
        <div className="max-w-[720px]">
          <span className="eyebrow text-chili-500">{eyebrow}</span>
          <h1 className="text-[clamp(2rem,6vw,2.6rem)] text-ink-900 mt-1.5 mb-3">
            {title}
          </h1>
          <div className="flex flex-col gap-3">
            {intro.map((p, i) => (
              <p key={i} className="text-ink-700 text-[1.12rem] leading-relaxed">
                {renderInline(p)}
              </p>
            ))}
          </div>
        </div>
        {exploreHref && (
          <Button
            href={exploreHref}
            variant="outline"
            iconLeft={<MapTrifold size={18} />}
          >
            View on map
          </Button>
        )}
      </div>

      {gallery && gallery.length > 0 && (
        <section className="mb-9 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {gallery.map((g) => (
            <div
              key={g.src}
              className="relative aspect-[4/3] rounded-lg overflow-hidden bg-paper-200"
            >
              <Image
                src={g.src}
                alt={g.alt}
                fill
                sizes="(max-width: 640px) 50vw, 280px"
                className="object-cover"
              />
            </div>
          ))}
        </section>
      )}

      {whatToOrder && whatToOrder.length > 0 && (
        <section className="mb-9 bg-paper-100 rounded-xl p-6 sm:p-7">
          <h2 className="flex items-center gap-2 font-display font-extrabold text-[1.4rem] text-ink-900 mb-4">
            <ForkKnife size={22} weight="fill" className="text-chili-500" />
            What to order
          </h2>
          <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {whatToOrder.map((w) => (
              <div key={w.dish}>
                <h3 className="font-display font-bold text-[1.08rem] text-ink-900">
                  {w.dish}
                </h3>
                <p className="text-ink-700 leading-relaxed">
                  {renderInline(w.note)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {groups ? (
        <div className="flex flex-col gap-10">
          {groups.map((g) => (
            <section key={g.state}>
              <div className="flex items-baseline justify-between gap-3 mb-4">
                <h2 className="font-display font-extrabold text-[1.5rem] text-ink-900">
                  Best {groupLabel} in {g.stateName}
                </h2>
                {g.total > g.spots.length && (
                  <Link
                    href={g.href}
                    className="shrink-0 inline-flex items-center gap-1 text-chili-600 font-display font-bold text-[0.95rem] hover:text-chili-700"
                  >
                    See all {g.total}
                    <ArrowRight size={15} weight="bold" />
                  </Link>
                )}
              </div>
              <div className={GRID}>
                {g.spots.map((r) => (
                  <PlaceCard key={r.id} r={r} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : restaurants.length === 0 ? (
        <p className="text-ink-500 py-12 text-center">
          No spots here yet. Try the map to explore nearby.
        </p>
      ) : (
        <>
          <div className={GRID}>
            {restaurants.map((r) => (
              <PlaceCard key={r.id} r={r} pills={r.matches} />
            ))}
          </div>
          {total != null && total > restaurants.length && content.exploreHref && (
            <p className="text-ink-500 text-center mt-6">
              Showing the top {restaurants.length}.{" "}
              <Link
                href={content.exploreHref}
                className="text-chili-600 font-semibold hover:text-chili-700"
              >
                See all {total} on the map
              </Link>
              .
            </p>
          )}
        </>
      )}

      {faq && faq.length > 0 && (
        <section className="mt-12 max-w-[760px]">
          <h2 className="font-display font-extrabold text-[1.6rem] text-ink-900 mb-4">
            Frequently asked
          </h2>
          <div className="flex flex-col gap-5">
            {faq.map((f) => (
              <div key={f.q}>
                <h3 className="font-display font-bold text-[1.12rem] text-ink-900 mb-1.5">
                  {f.q}
                </h3>
                <p className="text-ink-700 leading-relaxed">
                  {renderInline(f.a)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {crossLinks && crossLinks.length > 0 && (
        <section className="mt-12 border-t border-paper-300 pt-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {crossLinks.map((group) => (
              <div key={group.heading}>
                <h2 className="eyebrow text-ink-500 mb-3">{group.heading}</h2>
                <ul className="flex flex-col gap-2">
                  {group.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="text-ink-700 font-semibold hover:text-chili-600 transition-colors"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
