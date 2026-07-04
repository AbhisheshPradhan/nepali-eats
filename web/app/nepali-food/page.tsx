import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { renderInline, stripInline } from "@/components/inline";
import {
  CUISINES,
  DIETARY,
  SIGNATURE_DISH,
  NEPALI_FOOD_FAQ,
  foodImage,
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

function FoodCard({ item, hue }: { item: FoodLink; hue: number }) {
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

      <div className="max-w-[720px] mb-8">
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

      {/* Signature dish */}
      <section className="mb-10">
        <h2 className="eyebrow text-ink-500 mb-3">Start here</h2>
        <Link
          href={SIGNATURE_DISH.href}
          className="group grid md:grid-cols-[1.1fr_1fr] bg-white rounded-xl overflow-hidden shadow-md"
        >
          <div
            className="relative min-h-[220px]"
            style={{
              background:
                "linear-gradient(135deg, hsl(18 82% 62%), hsl(4 78% 52%))",
            }}
          >
            {foodImage(SIGNATURE_DISH.slug) && (
              <Image
                src={foodImage(SIGNATURE_DISH.slug)!.src}
                alt={foodImage(SIGNATURE_DISH.slug)!.alt}
                fill
                sizes="(max-width: 768px) 100vw, 560px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                priority
              />
            )}
          </div>
          <div className="p-7 flex flex-col justify-center">
            <h3 className="font-display font-extrabold text-[2rem] text-ink-900 mb-2 group-hover:text-chili-600 transition-colors">
              {SIGNATURE_DISH.name}
            </h3>
            <p className="text-ink-700 text-[1.1rem] leading-relaxed mb-4">
              {SIGNATURE_DISH.blurb}
            </p>
            <span className="inline-flex items-center gap-1.5 text-chili-600 font-display font-bold">
              Find the best momo <ArrowRight size={18} weight="bold" />
            </span>
          </div>
        </Link>
      </section>

      {/* Cuisines & styles */}
      <section className="mb-10">
        <h2 className="font-display font-extrabold text-[1.6rem] text-ink-900 mb-4">
          Cuisines and styles
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...CUISINES, ...DIETARY].map((item, i) => (
            <FoodCard key={item.slug} item={item} hue={HUES[i % HUES.length]} />
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
