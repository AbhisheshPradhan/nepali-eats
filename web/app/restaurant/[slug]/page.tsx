import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MapPin,
  Clock,
  NavigationArrow,
  Phone,
  Globe,
  Leaf,
  ForkKnife,
  EnvelopeSimple,
  FacebookLogo,
  InstagramLogo,
  TiktokLogo,
  WhatsappLogo,
  Storefront,
} from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/Badge";
import { Tag } from "@/components/ui/Tag";
import { Rating } from "@/components/ui/Rating";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/Avatar";
import { SaveButton } from "@/components/SaveButton";
import DetailMap from "@/components/DetailMap";
import { getRestaurantBySlug } from "@/lib/queries";
import { mediaUrl } from "@/lib/media";
import {
  priceString,
  isOpenNow,
  todayHoursLine,
  weekSchedule,
  autoBlurb,
  directionsUrl,
  hueFromId,
} from "@/lib/format";

export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://nepalieats.com.au";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const r = await getRestaurantBySlug(slug);
  if (!r) return { title: "Spot not found" };
  const where = [r.suburb, r.state].filter(Boolean).join(", ");
  const title = `${r.name} - Nepali ${(r.venueType || "restaurant").toLowerCase()} in ${where}`;
  const img = mediaUrl(r.primaryPhoto);
  const blurb = r.description?.trim() || autoBlurb(r);
  return {
    title,
    description: blurb,
    alternates: { canonical: `/restaurant/${r.slug}` },
    openGraph: {
      title,
      description: blurb,
      images: img ? [{ url: img }] : undefined,
    },
  };
}

export default async function VenuePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const r = await getRestaurantBySlug(slug);
  if (!r) notFound();

  const hero = mediaUrl(r.primaryPhoto);
  // gallery = every photo except the hero, in saved order (admin-reorderable).
  const gallery = r.photos
    .filter((p) => p.storageKey !== r.primaryPhoto)
    .slice(0, 6)
    .map((p) => mediaUrl(p.storageKey));
  const open = isOpenNow(r.openingHours, r.state);
  const hoursToday = todayHoursLine(r.openingHours, r.state);
  const week = weekSchedule(r.openingHours, r.state);
  const price = priceString(r);
  const hue = hueFromId(r.id);
  const where = [r.suburb, r.state].filter(Boolean).join(", ");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: r.name,
    servesCuisine: "Nepalese",
    "@id": `${SITE}/restaurant/${r.slug}`,
    url: `${SITE}/restaurant/${r.slug}`,
    ...(hero ? { image: hero.startsWith("http") ? hero : `${SITE}${hero}` } : {}),
    ...(r.phone ? { telephone: r.phone } : {}),
    ...(r.priceLevel ? { priceRange: "$".repeat(r.priceLevel) } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: r.street || undefined,
      addressLocality: r.suburb || undefined,
      addressRegion: r.state || undefined,
      postalCode: r.postcode || undefined,
      addressCountry: "AU",
    },
    ...(r.lat && r.lng
      ? { geo: { "@type": "GeoCoordinates", latitude: r.lat, longitude: r.lng } }
      : {}),
    // No aggregateRating: Google disallows self-serving review snippets on
    // LocalBusiness/Restaurant (a page rating itself), which risks a manual
    // action. The rating and Google review count are still shown to users
    // below; we just don't emit them as structured data.
  };

  const socials = [
    { href: r.facebook, label: "Facebook", icon: <FacebookLogo size={20} weight="fill" /> },
    { href: r.instagram, label: "Instagram", icon: <InstagramLogo size={20} /> },
    { href: r.tiktok, label: "TikTok", icon: <TiktokLogo size={20} weight="fill" /> },
    { href: r.whatsapp, label: "WhatsApp", icon: <WhatsappLogo size={20} weight="fill" /> },
  ].filter((s) => s.href);

  return (
    <div className="max-w-[1180px] mx-auto px-6 pt-5 pb-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* cover photo (Facebook-style: name + logo live in the strip below) */}
      <div
        className="h-[280px] rounded-xl relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, hsl(${hue} 80% 62%), hsl(${(hue + 40) % 360} 78% 52%))`,
        }}
      >
        {hero ? (
          <Image src={hero} alt={r.name} fill priority sizes="1180px" className="object-cover" />
        ) : (
          <div className="absolute inset-0 grid place-items-center opacity-35 text-white">
            <ForkKnife size={112} weight="fill" />
          </div>
        )}
      </div>

      {/* identity strip: logo overlapping the cover (when present), then name +
          badges. With no logo we drop the circle entirely and sit the name just
          below the cover instead of pulling it up over the photo. */}
      <div
        className={`flex items-end gap-4 px-2 sm:px-5 relative z-10 ${
          r.logoKey ? "-mt-12" : "mt-4"
        }`}
      >
        {r.logoKey && (
          <Avatar name={r.name} logoKey={r.logoKey} id={r.id} size={104} ring />
        )}
        <div className="pb-1 min-w-0">
          <h1 className="font-display font-extrabold text-[2.2rem] sm:text-[2.6rem] text-ink-900 leading-tight m-0 truncate">
            {r.name}
          </h1>
          <div className="flex gap-2 mt-2">
            {open !== null && (
              <Badge tone={open ? "open" : "closed"} solid>
                {open ? "Open now" : "Closed"}
              </Badge>
            )}
            <Badge tone="neutral" solid>
              {r.venueType || "Restaurant"}
            </Badge>
          </div>
        </div>
      </div>

      {/* body */}
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_320px] gap-9 mt-7 items-start">
        <div>
          <div className="flex items-center gap-4 flex-wrap mb-4">
            {r.rating != null && <Rating value={r.rating} count={r.reviewCount} size={22} />}
            {price && <span className="text-ink-500 font-semibold">{price}</span>}
            {where && (
              <span className="text-ink-500 inline-flex items-center gap-1.5">
                <MapPin size={16} weight="fill" />
                {where}
              </span>
            )}
            <SaveButton restaurantId={String(r.id)} className="ml-auto" />
          </div>

          {r.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-5">
              {r.tags.map((c) => (
                <Tag key={c} className="capitalize">
                  {c === "indian-nepali" ? "Nepali-Indian" : c}
                </Tag>
              ))}
            </div>
          )}

          <p className="text-[1.18rem] leading-relaxed text-ink-700 mb-7">{r.description?.trim() || autoBlurb(r)}</p>

          {/* gallery */}
          {gallery.length > 0 && (
            <>
              <h2 className="font-display font-extrabold text-[1.5rem] mb-3">Photos</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                {gallery.map((g, i) =>
                  g ? (
                    <div key={i} className="relative aspect-[4/3] rounded-md overflow-hidden bg-paper-200">
                      <Image src={g} alt={`${r.name} photo ${i + 2}`} fill sizes="300px" className="object-cover" />
                    </div>
                  ) : null
                )}
              </div>
            </>
          )}

          {/* menu — hidden for now; restore once menus are parsed/finalised.
          <h2 className="font-display font-extrabold text-[1.5rem] mb-2">The menu</h2>
          <div className="bg-white rounded-lg shadow-sm p-5 mb-8">
            {r.menuUrl ? (
              <a
                href={(r.menuSource === "upload" ? mediaUrl(r.menuUrl) : r.menuUrl) ?? r.menuUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-display font-bold text-chili-600 hover:text-chili-700"
              >
                <ForkKnife size={20} weight="fill" /> See the full menu
              </a>
            ) : (
              <p className="text-ink-500 m-0">
                The full menu is coming soon. Call ahead for today&apos;s specials.
              </p>
            )}
          </div>
          */}

          {/* where to find it */}
          {r.lat != null && r.lng != null && (
            <>
              <h2 className="font-display font-extrabold text-[1.5rem] mb-3">Where to find it</h2>
              <div className="relative h-80 rounded-lg overflow-hidden shadow-sm mb-8">
                <DetailMap lat={r.lat} lng={r.lng} name={r.name} />
              </div>
            </>
          )}

          {/* reviews summary */}
          {r.rating != null && r.reviewCount != null && (
            <>
              <h2 className="font-display font-extrabold text-[1.5rem] mb-3">What people say</h2>
              <div className="bg-white rounded-lg shadow-sm p-5 flex items-center gap-4">
                <span className="font-display font-extrabold text-[2.4rem] text-ink-900 leading-none">
                  {r.rating.toFixed(1)}
                </span>
                <div>
                  <Rating value={r.rating} showValue={false} size={18} />
                  <p className="text-ink-500 m-0 mt-1 text-[0.95rem]">
                    {r.reviewCount.toLocaleString()} reviews on Google
                  </p>
                </div>
                {r.googleMapsUrl && (
                  <a
                    href={r.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto font-display font-bold text-chili-600 hover:text-chili-700 text-[0.95rem]"
                  >
                    Read on Google
                  </a>
                )}
              </div>
            </>
          )}
        </div>

        {/* sidebar */}
        <aside className="md:sticky md:top-20 flex flex-col gap-3.5">
          <div className="bg-white rounded-lg shadow-md p-5">
            <Button
              href={directionsUrl(r)}
              newTab
              block
              iconLeft={<NavigationArrow size={18} weight="fill" />}
              className="mb-2.5"
            >
              Get directions
            </Button>
            {r.phone && (
              <Button href={`tel:${r.phone}`} block variant="outline" iconLeft={<Phone size={18} />} className="mb-2.5">
                Call the kitchen
              </Button>
            )}
            {r.website && (
              <Button href={r.website} newTab block variant="ghost" iconLeft={<Globe size={18} />}>
                Visit website
              </Button>
            )}

            {socials.length > 0 && (
              <div className="flex gap-2 mt-4 pt-4 border-t border-paper-300">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href!}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="w-10 h-10 rounded-full grid place-items-center bg-paper-100 text-ink-700 hover:bg-chili-100 hover:text-chili-600 transition-colors"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            )}

            {/* hours */}
            {week && (
              <div className="mt-4 pt-4 border-t border-paper-300">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={20} className={open ? "text-coriander-500" : "text-ink-500"} />
                  <span
                    className={`font-display font-bold ${open ? "text-coriander-700" : "text-ink-700"}`}
                  >
                    {open ? "Open now" : hoursToday ? `Today: ${hoursToday}` : "Hours vary"}
                  </span>
                </div>
                {week.map((d) => (
                  <div
                    key={d.day}
                    className={`flex justify-between py-1.5 text-[0.95rem] ${
                      d.today ? "font-bold text-ink-900" : "text-ink-700"
                    }`}
                  >
                    <span>
                      {d.day}
                      {d.today ? " · Today" : ""}
                    </span>
                    <span className={d.range === "Closed" ? "text-ink-500" : ""}>{d.range}</span>
                  </div>
                ))}
              </div>
            )}

            {/* facts */}
            <div className="mt-2 pt-3 border-t border-paper-300">
              {r.fullAddress && (
                <div className="flex gap-3 items-center py-3 border-b border-paper-300">
                  <MapPin size={20} className="text-chili-500 shrink-0" weight="fill" />
                  <span className="text-ink-700">{r.fullAddress}</span>
                </div>
              )}
              {r.email && (
                <div className="flex gap-3 items-center py-3 border-b border-paper-300">
                  <EnvelopeSimple size={20} className="text-chili-500 shrink-0" />
                  <a href={`mailto:${r.email}`} className="text-ink-700 hover:text-chili-600 break-all">
                    {r.email}
                  </a>
                </div>
              )}
              {r.tags.includes("vegetarian") && (
                <div className="flex gap-3 items-center py-3">
                  <Leaf size={20} className="text-coriander-500 shrink-0" weight="fill" />
                  <span className="text-ink-700">Vegetarian options available</span>
                </div>
              )}
            </div>
          </div>

          {where && (
            <Link
              href={`/explore?suburb=${encodeURIComponent(r.suburb || "")}`}
              className="w-full bg-marigold-100 rounded-lg py-3.5 text-marigold-700 font-display font-bold inline-flex items-center justify-center gap-2 hover:bg-marigold-300/50 transition-colors"
            >
              <Storefront size={18} weight="fill" /> More spots in {r.suburb}
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}
