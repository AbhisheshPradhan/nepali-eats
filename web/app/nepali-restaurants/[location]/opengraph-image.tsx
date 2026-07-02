import { ImageResponse } from "next/og";
import { OG, OG_SIZE, OG_CONTENT_TYPE, ogFonts, ogMomo } from "@/lib/og";
import { suburbFacets, stateFacets } from "@/lib/queries";
import { suburbSlug } from "@/lib/format";

export const runtime = "nodejs";
export const alt = "Nepali restaurants";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

const STATE_CODE: Record<string, string> = {
	nsw: "NSW", vic: "VIC", qld: "QLD", wa: "WA",
	sa: "SA", act: "ACT", tas: "TAS", nt: "NT",
};
const STATE_NAME: Record<string, string> = {
	NSW: "New South Wales", VIC: "Victoria", QLD: "Queensland",
	WA: "Western Australia", SA: "South Australia",
	ACT: "the ACT", TAS: "Tasmania", NT: "the Northern Territory",
};

async function resolve(location: string) {
	const code = location.toLowerCase();
	if (STATE_CODE[code]) {
		const state = STATE_CODE[code];
		const count = (await stateFacets()).find((s) => s.value === state)?.count ?? 0;
		return { place: STATE_NAME[state] || state, sub: "", count };
	}
	const match = (await suburbFacets()).find(
		(s) => suburbSlug(s.value, s.state) === location,
	);
	if (match) return { place: match.value, sub: match.state, count: match.count };
	return null;
}

export default async function Image({
	params,
}: {
	params: Promise<{ location: string }>;
}) {
	const { location } = await params;
	const [fonts, momo, r] = await Promise.all([
		ogFonts(),
		ogMomo(),
		resolve(location),
	]);

	const place = r?.place ?? "Australia";
	const sub = r?.sub ?? "";
	const count = r?.count ?? 0;
	const pill = count
		? `${count} spots for momo, dal bhat and Newari feasts`
		: "Momo, dal bhat and Newari feasts";

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
				<div style={{ width: "46%", height: "100%", display: "flex" }}>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={momo}
						width={552}
						height={630}
						style={{ width: "100%", height: "100%", objectFit: "cover" }}
					/>
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
					<div style={{ display: "flex", fontSize: 34, fontWeight: 800 }}>
						<span style={{ color: OG.chili }}>Nepali</span>
						<span style={{ color: OG.ink }}>Eats</span>
					</div>
					<div
						style={{
							display: "flex",
							fontSize: 40,
							fontWeight: 700,
							color: OG.ink,
							marginTop: 20,
						}}
					>
						Nepali restaurants in
					</div>
					<div
						style={{
							display: "flex",
							fontSize: 76,
							fontWeight: 800,
							color: OG.chili,
							lineHeight: 1.02,
						}}
					>
						{place}
					</div>
					{sub ? (
						<div
							style={{
								display: "flex",
								fontSize: 32,
								fontWeight: 700,
								color: OG.ink,
								opacity: 0.7,
								marginTop: 6,
							}}
						>
							{sub}
						</div>
					) : null}
					<div style={{ display: "flex", marginTop: 26 }}>
						<div
							style={{
								display: "flex",
								background: OG.chili,
								color: OG.white,
								padding: "13px 24px",
								borderRadius: 999,
								fontSize: 24,
								fontWeight: 700,
							}}
						>
							{pill}
						</div>
					</div>
				</div>
			</div>
		),
		{ ...size, fonts },
	);
}
