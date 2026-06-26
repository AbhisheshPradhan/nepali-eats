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
	MusicNotes,
	Baby,
	Car,
	Wine,
	Wheelchair,
} from "@phosphor-icons/react/dist/ssr";
import { FeaturedBadge, PopularBadge } from "@/components/ui/PlaceBadges";
import { VenueType } from "@/components/ui/VenueType";
import { Tag } from "@/components/ui/Tag";
import { Rating } from "@/components/ui/Rating";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/Avatar";
import { SaveButton } from "@/components/SaveButton";
import { EditModeProvider } from "@/components/edit/EditModeProvider";
import { EditToggle } from "@/components/edit/EditToggle";
import { EditPanelMount } from "@/components/edit/EditPanelMount";
import { OpenStatusBadge } from "@/components/OpenStatusBadge";
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
import { PriceLevel } from "@/components/ui/PriceLevel";

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

	// "Good to know" facts from the Google Places reconcile pass. Only render a
	// row when the attribute is known and true (NULL = unknown stays hidden). Veg
	// falls back to the name-derived tag when the API didn't report it.
	const facts: { icon: React.ReactNode; label: string }[] = [];
	if (r.servesVegetarian === true || r.tags.includes("vegetarian"))
		facts.push({
			icon: (
				<Leaf
					size={20}
					weight="fill"
					className="text-coriander-500 shrink-0"
				/>
			),
			label: "Vegetarian options",
		});
	if (r.kidFriendly === true)
		facts.push({
			icon: (
				<Baby
					size={20}
					className="text-chili-500 shrink-0"
				/>
			),
			label: "Good for kids",
		});
	if (r.liveMusic === true)
		facts.push({
			icon: (
				<MusicNotes
					size={20}
					className="text-chili-500 shrink-0"
				/>
			),
			label: "Live music",
		});
	if (r.parking)
		facts.push({
			icon: (
				<Car
					size={20}
					className="text-chili-500 shrink-0"
				/>
			),
			label: r.parking,
		});
	if (r.servesAlcohol === true)
		facts.push({
			icon: (
				<Wine
					size={20}
					className="text-chili-500 shrink-0"
				/>
			),
			label: "Serves alcohol",
		});
	if (r.wheelchairAccessible === true)
		facts.push({
			icon: (
				<Wheelchair
					size={20}
					className="text-chili-500 shrink-0"
				/>
			),
			label: "Wheelchair accessible",
		});

	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "Restaurant",
		name: r.name,
		servesCuisine: "Nepalese",
		"@id": `${SITE}/restaurant/${r.slug}`,
		url: `${SITE}/restaurant/${r.slug}`,
		...(hero
			? { image: hero.startsWith("http") ? hero : `${SITE}${hero}` }
			: {}),
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
			? {
					geo: {
						"@type": "GeoCoordinates",
						latitude: r.lat,
						longitude: r.lng,
					},
				}
			: {}),
		// No aggregateRating: Google disallows self-serving review snippets on
		// LocalBusiness/Restaurant (a page rating itself), which risks a manual
		// action. The rating and Google review count are still shown to users
		// below; we just don't emit them as structured data.
	};

	const socials = [
		{
			href: r.facebook,
			label: "Facebook",
			icon: (
				<FacebookLogo
					size={20}
					weight="fill"
				/>
			),
		},
		{
			href: r.instagram,
			label: "Instagram",
			icon: <InstagramLogo size={20} />,
		},
		{
			href: r.tiktok,
			label: "TikTok",
			icon: (
				<TiktokLogo
					size={20}
					weight="fill"
				/>
			),
		},
		{
			href: r.whatsapp,
			label: "WhatsApp",
			icon: (
				<WhatsappLogo
					size={20}
					weight="fill"
				/>
			),
		},
	].filter((s) => s.href);

	// Single icon-only contact row: socials, then website (second-last), email last.
	const contactLinks = [
		...socials.map((s) => ({ ...s, newTab: true })),
		...(r.website
			? [
					{
						href: r.website,
						label: "Website",
						icon: <Globe size={20} />,
						newTab: true,
					},
				]
			: []),
		...(r.email
			? [
					{
						href: `mailto:${r.email}`,
						label: "Email",
						icon: <EnvelopeSimple size={20} />,
						newTab: false,
					},
				]
			: []),
	];

	return (
		<EditModeProvider
			slug={r.slug}
			restaurantId={String(r.id)}
		>
			<div className="max-w-295 mx-auto px-0 sm:px-6 pb-24 md:pb-4">
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
				/>

				{/* cover photo (Facebook-style: name + logo live in the strip below).
          16:9 standard, height-capped so it stays cinematic on desktop without
          pushing the name offscreen; the photo crops via object-cover. */}
				<div
					className="w-full aspect-video max-h-35 sm:max-h-55 sm:rounded-sm relative overflow-hidden"
					style={{
						background: `linear-gradient(135deg, hsl(${hue} 80% 62%), hsl(${(hue + 40) % 360} 78% 52%))`,
					}}
				>
					{hero ? (
						<Image
							src={hero}
							alt={r.name}
							fill
							priority
							sizes="1180px"
							className="object-cover"
						/>
					) : (
						<div className="absolute inset-0 grid place-items-center opacity-35 text-white">
							<ForkKnife
								size={112}
								weight="fill"
							/>
						</div>
					)}

					{/* Edit Restaurant (admins/owners only) + Save float top-right of the
				    cover, Edit to the left of the favourite. EditToggle renders nothing
				    for visitors without edit rights, so Save sits alone for everyone else. */}
					<div className="absolute top-3 right-3 z-10 flex items-center gap-2">
						<EditToggle />
						<SaveButton
							restaurantId={String(r.id)}
							variant="floating"
						/>
					</div>
				</div>

				{/* identity strip: logo overlaps the cover (when present); the name +
          badges sit below the cover to the right of the logo. With no logo we
          drop the circle entirely and the name sits just below the cover. */}
				<div
					className={`flex items-start gap-4 relative z-10 mt-2 sm:mt-4 px-4 sm:px-0 ${
						r.logoKey ? "px-2 sm:px-5" : ""
					}`}
				>
					{r.logoKey && (
						<div className="-mt-16 shrink-0 hidden sm:block">
							<Avatar
								name={r.name}
								logoKey={r.logoKey}
								id={r.id}
								size={104}
								ring
							/>
						</div>
					)}
					<div className="min-w-0">
						<h1 className="font-display font-extrabold text-[1.5rem] sm:text-[2.6rem] text-ink-900 leading-tight m-0 mb-2 truncate">
							{r.name}
						</h1>
						<div className="flex items-center gap-2.5 mb-2 flex-wrap">
							{r.isFeatured && <FeaturedBadge />}
							{r.popular && <PopularBadge />}
						</div>
					</div>
				</div>

				{/* body */}
				<div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_320px] gap-9 items-start px-4 sm:px-0">
					<div>
						<div className="flex items-center gap-2 sm:gap-4 flex-wrap mb-4">
							{r.rating != null && (
								<Rating
									value={r.rating}
									count={r.reviewCount}
									size={22}
								/>
							)}
							<PriceLevel level={r.priceLevel} />
							<VenueType
								type={r.venueType}
								iconSize={15}
								className="text-[1rem]"
							/>

							{/* {price && (
							<span className="text-ink-500 font-semibold">
								{price}
							</span>
						)} */}

							{/* {where && (
							<span className="text-ink-500 inline-flex items-center gap-1.5">
								<MapPin
									size={16}
									weight="fill"
								/>
								{where}
							</span>
						)} */}

							{r.fullAddress && (
								<div className="flex gap-1 items-center">
									<MapPin
										size={20}
										className="text-chili-500 shrink-0"
										weight="fill"
									/>
									<span className="text-ink-700">
										{r.fullAddress}
									</span>
								</div>
							)}
						</div>

						{r.tags.length > 0 && (
							<div className="flex gap-2 flex-wrap mb-5">
								{r.tags.map((c) => (
									<Tag
										key={c}
										className="capitalize"
									>
										{c === "indian-nepali"
											? "Nepali-Indian"
											: c}
									</Tag>
								))}
							</div>
						)}

						{r.description && (
							<p className="text-[1.18rem] leading-relaxed text-ink-700 mb-7">
								{r.description?.trim()}
							</p>
						)}

						{/* gallery */}
						{gallery.length > 0 && (
							<>
								<h2 className="font-display font-extrabold text-[1.5rem] mb-3">
									Photos
								</h2>
								<div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
									{gallery.map((g, i) =>
										g ? (
											<div
												key={i}
												className="relative aspect-[4/3] rounded-md overflow-hidden bg-paper-200"
											>
												<Image
													src={g}
													alt={`${r.name} photo ${i + 2}`}
													fill
													sizes="300px"
													className="object-cover"
												/>
											</div>
										) : null,
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
								<h2 className="font-display font-extrabold text-[1.5rem] mb-3">
									Where to find it
								</h2>
								<div className="relative h-80 rounded-lg overflow-hidden shadow-sm mb-8">
									<DetailMap
										lat={r.lat}
										lng={r.lng}
										name={r.name}
									/>
								</div>
							</>
						)}

						{/* reviews summary */}
						{r.rating != null && r.reviewCount != null && (
							<>
								<h2 className="font-display font-extrabold text-[1.5rem] mb-3">
									What people say
								</h2>
								<div className="bg-white rounded-lg shadow-sm p-5 flex items-center gap-4">
									<span className="font-display font-extrabold text-[2.4rem] text-ink-900 leading-none">
										{r.rating.toFixed(1)}
									</span>
									<div>
										<Rating
											value={r.rating}
											showValue={false}
											size={18}
										/>
										<p className="text-ink-500 m-0 mt-1 text-[0.95rem]">
											{r.reviewCount.toLocaleString()}{" "}
											reviews on Google
										</p>
									</div>
									{/* {r.googleMapsUrl && (
									<a
										href={r.googleMapsUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="ml-auto font-display font-bold text-chili-600 hover:text-chili-700 text-[0.7rem]"
									>
										Read on Google
									</a>
								)} */}
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
								iconLeft={
									<NavigationArrow
										size={18}
										weight="fill"
									/>
								}
								className="mb-2.5"
							>
								Get directions
							</Button>
							{r.phone && (
								<Button
									href={`tel:${r.phone}`}
									block
									variant="outline"
									iconLeft={<Phone size={18} />}
								>
									Call the kitchen
								</Button>
							)}

							{/* hours + open/closed status. Render whenever we have a week of
						    hours OR the spot is temporarily/permanently closed (a
						    business-level fact worth showing even without hours data). */}
							{(week ||
								r.businessStatus === "CLOSED_TEMPORARILY" ||
								r.businessStatus === "CLOSED_PERMANENTLY") && (
								<div className="mt-4 pt-4 border-t border-paper-300">
									<OpenStatusBadge
										openingHours={r.openingHours}
										state={r.state}
										businessStatus={r.businessStatus}
									/>
									{week?.map((d) => (
										<div
											key={d.day}
											className={`flex justify-between py-1.5 text-[0.95rem] ${
												d.today
													? "font-bold text-ink-900"
													: "text-ink-700"
											}`}
										>
											<span>
												{d.day}
												{d.today ? " · Today" : ""}
											</span>
											<span
												className={
													d.range === "Closed"
														? "text-ink-500"
														: ""
												}
											>
												{d.range}
											</span>
										</div>
									))}
								</div>
							)}

							{/* Good to know — facts reconciled from the Google Places
						    pass (see reconcile-places.js). Each row is independently
						    gated; only true/known attributes show. */}
							{facts.length > 0 && (
								<div className="mt-4 pt-4 border-t border-paper-300">
									{facts.map((f, i) => (
										<div
											key={i}
											className="flex gap-3 items-center py-3"
										>
											{f.icon}
											<span className="text-ink-700">
												{f.label}
											</span>
										</div>
									))}
								</div>
							)}

							{/* contact: website, socials, email as one icon-only row */}
							{contactLinks.length > 0 && (
								<div className="mt-4 pt-4 border-t border-paper-300 flex gap-2 flex-wrap justify-center">
									{contactLinks.map((c) => (
										<a
											key={c.label}
											href={c.href!}
											{...(c.newTab
												? {
														target: "_blank",
														rel: "noopener noreferrer",
													}
												: {})}
											aria-label={c.label}
											title={c.label}
											className="w-10 h-10 rounded-full grid place-items-center bg-paper-100 text-ink-700 hover:bg-chili-100 hover:text-chili-600 transition-colors"
										>
											{c.icon}
										</a>
									))}
								</div>
							)}
						</div>

						{where && (
							<Link
								href={`/explore?suburb=${encodeURIComponent(r.suburb || "")}`}
								className="w-full bg-marigold-100 rounded-lg py-3.5 text-marigold-700 font-display font-bold inline-flex items-center justify-center gap-2 hover:bg-marigold-300/50 transition-colors"
							>
								<Storefront
									size={18}
									weight="fill"
								/>{" "}
								More spots in {r.suburb}
							</Link>
						)}
					</aside>
				</div>

				{/* sticky mobile action bar — phone-only (md:hidden); mirrors the
          sidebar's primary CTAs so they stay reachable while scrolling. */}
				<div className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur border-t border-paper-300 px-3 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] flex gap-2.5">
					{r.phone && (
						<Button
							href={`tel:${r.phone}`}
							block
							variant="outline"
							iconLeft={<Phone size={18} />}
						>
							Call
						</Button>
					)}
					<Button
						href={directionsUrl(r)}
						newTab
						block
						iconLeft={
							<NavigationArrow
								size={18}
								weight="fill"
							/>
						}
					>
						Directions
					</Button>
				</div>
			</div>
			<EditPanelMount restaurant={r} />
		</EditModeProvider>
	);
}
