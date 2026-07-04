import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { renderInline, stripInline } from "@/components/inline";
import {
  FAMILIES,
  EXTRAS,
  NEPALI_FOOD_FAQ,
  foodImage,
  type FoodFamily,
  type FoodLink,
} from "@/lib/food";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://nepalieats.com.au";

export const metadata: Metadata = {
  title: "Nepali food explained: dishes, cuisines and where to eat them",
  description:
    "A guide to Nepali food in Australia: momo, Thakali dal bhat, Newari choila, Tibetan thukpa and more, with the kitchens serving each one.",
  alternates: { canonical: "/nepali-food" },
};

const HUES = [18, 168, 35, 4, 120, 45];

// One dish family: heading, blogger intro, optional photo + "see all" link,
// then its dishes as linked name-and-note rows (same pattern as the landing
// pages' "What to order" blocks).
function FamilySection({ family }: { family: FoodFamily }) {
  const img = foodImage(family.slug);
  return (
    <section className="mb-12">
      <h2 className="font-display font-extrabold text-[1.7rem] text-ink-900 mb-3">
        {family.heading}
      </h2>
      <div
        className={
          img
            ? "grid md:grid-cols-[minmax(0,360px)_1fr] gap-6 items-start mb-6"
            : "mb-6"
        }
      >
        {img && (
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-paper-200">
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes="(max-width: 768px) 100vw, 360px"
              className="object-cover"
            />
          </div>
        )}
        <div className="max-w-[680px]">
          {family.blurb.map((p) => (
            <p
              key={p.slice(0, 24)}
              className="text-ink-700 text-[1.08rem] leading-relaxed mb-3"
            >
              {p}
            </p>
          ))}
          {family.href && family.linkLabel && (
            <Link
              href={family.href}
              className="inline-flex items-center gap-1.5 text-chili-600 font-display font-bold hover:text-chili-700"
            >
              {family.linkLabel} <ArrowRight size={17} weight="bold" />
            </Link>
          )}
        </div>
      </div>
      {family.dishes.length > 0 && (
        <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {family.dishes.map((d) => (
            <div key={d.slug}>
              <h3 className="font-display font-bold text-[1.08rem]">
                <Link
                  href={d.href}
                  className="text-ink-900 hover:text-chili-600 transition-colors"
                >
                  {d.name}
                </Link>
              </h3>
              <p className="text-ink-700 leading-relaxed">{d.blurb}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ExtraCard({ item, hue }: { item: FoodLink; hue: number }) {
  const img = foodImage(item.slug);
  return (
    <Link
      href={item.href}
      className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition flex flex-col"
    >
      <div
        className="relative aspect-[16/10] overflow-hidden"
        style={{
          background: `linear-gradient(135deg, hsl(${hue} 82% 62%), hsl(${(hue + 28) % 360} 78% 52%))`,
        }}
      >
        {img && (
          <Image
            src={img.src}
            alt={img.alt}
            fill
            sizes="(max-width: 768px) 100vw, 360px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
      </div>
      <div className="p-5 flex flex-col gap-1.5 flex-1">
        <h3 className="font-display font-bold text-[1.25rem] text-ink-900 group-hover:text-chili-600 transition-colors">
          {item.name}
        </h3>
        <p className="text-ink-700 leading-snug">{item.blurb}</p>
      </div>
    </Link>
  );
}

export default function NepaliFoodHub() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
          {
            "@type": "ListItem",
            position: 2,
            name: "Nepali food",
            item: `${SITE}/nepali-food`,
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: NEPALI_FOOD_FAQ.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: stripInline(f.a) },
        })),
      },
    ],
  };

  return (
    <div className="max-w-[1180px] mx-auto px-4 sm:px-6 pt-6 pb-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <Breadcrumbs
        trail={[
          { label: "Home", href: "/" },
          { label: "Nepali food", href: "/nepali-food" },
        ]}
      />

      <div className="max-w-[720px] mb-10">
        <span className="eyebrow text-chili-500">A field guide</span>
        <h1 className="text-[clamp(2rem,6vw,2.6rem)] text-ink-900 mt-1.5 mb-3">
          Nepali food, explained
        </h1>
        <p className="text-ink-700 text-[1.12rem] leading-relaxed">
          New to Nepali food, or just want to know what to order next? Here are
          the cuisines and dishes worth knowing, and the kitchens across
          Australia doing each one well. Start with momo, then keep going.
        </p>
      </div>

      {/* Dish families: momo, Newari, Thakali, Tibetan, the grill */}
      {FAMILIES.map((f) => (
        <FamilySection key={f.slug} family={f} />
      ))}

      {/* The audience filters that aren't cuisines */}
      <section className="mb-10">
        <h2 className="font-display font-extrabold text-[1.7rem] text-ink-900 mb-4">
          Also good to know
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {EXTRAS.map((item, i) => (
            <ExtraCard key={item.slug} item={item} hue={HUES[i % HUES.length]} />
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-12 max-w-[760px]">
        <h2 className="font-display font-extrabold text-[1.6rem] text-ink-900 mb-4">
          Nepali food, frequently asked
        </h2>
        <div className="flex flex-col gap-5">
          {NEPALI_FOOD_FAQ.map((f) => (
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

      <div className="mt-12 p-7 bg-ink-900 rounded-xl text-center">
        <h2 className="text-[1.6rem] text-white mb-3.5">Hungry yet?</h2>
        <Button href="/explore" variant="secondary" iconRight={<ArrowRight size={18} />}>
          Find Nepali food near you
        </Button>
      </div>
    </div>
  );
}
