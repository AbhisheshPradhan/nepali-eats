import { ImageResponse } from "next/og";
import { OG, OG_SIZE, OG_CONTENT_TYPE, ogFonts, ogMomo, pngDataUrl } from "@/lib/og";
import { getCardBySlug } from "@/lib/queries";
import { mediaUrl } from "@/lib/media";

export const runtime = "nodejs";
export const alt = "NepaliEats restaurant";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const [fonts, momo, r] = await Promise.all([
		ogFonts(),
		ogMomo(),
		getCardBySlug(slug),
	]);
	// Prefer the restaurant's own logo; fall back to the momo image.
	const logo = r ? await pngDataUrl(mediaUrl(r.logoKey)) : null;

	const name = r?.name ?? "Nepali restaurants in Australia";
	const place = r ? [r.suburb, r.state].filter(Boolean).join(", ") : "";
	const rating = r?.rating != null ? r.rating.toFixed(1) : null;
	const reviews = r?.reviewCount ?? null;

	return new ImageResponse(
		(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					fontFamily: "Baloo 2",
					background: OG.cream,
				}}
			>
				<div
					style={{
						width: "44%",
						height: "100%",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						background: logo ? OG.white : "transparent",
					}}
				>
					{logo ? (
						<img
							alt=""
							src={logo}
							width={420}
							height={420}
							style={{ width: 420, height: 420, objectFit: "contain" }}
						/>
					) : (
						<img
							alt=""
							src={momo}
							width={528}
							height={630}
							style={{ width: "100%", height: "100%", objectFit: "cover" }}
						/>
					)}
				</div>
				<div
					style={{
						flex: 1,
						display: "flex",
						flexDirection: "column",
						justifyContent: "center",
						padding: "0 56px",
					}}
				>
					<div style={{ display: "flex", fontSize: 32, fontWeight: 800 }}>
						<span style={{ color: OG.chili }}>Nepali</span>
						<span style={{ color: OG.ink }}>Eats</span>
					</div>
					<div
						style={{
							display: "flex",
							fontSize: 58,
							fontWeight: 800,
							color: OG.ink,
							lineHeight: 1.05,
							marginTop: 18,
						}}
					>
						{name}
					</div>
					{place ? (
						<div
							style={{
								display: "flex",
								fontSize: 30,
								fontWeight: 700,
								color: OG.ink,
								opacity: 0.7,
								marginTop: 14,
							}}
						>
							{place}
						</div>
					) : null}
					{rating ? (
						<div style={{ display: "flex", marginTop: 24 }}>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									background: OG.marigold,
									color: OG.ink,
									padding: "10px 22px",
									borderRadius: 999,
									fontSize: 28,
									fontWeight: 800,
								}}
							>
								{`★ ${rating}${reviews ? ` (${reviews})` : ""}`}
							</div>
						</div>
					) : null}
				</div>
			</div>
		),
		{ ...size, fonts },
	);
}
