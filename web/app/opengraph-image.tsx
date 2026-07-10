import { ImageResponse } from "next/og";
import { OG, OG_SIZE, OG_CONTENT_TYPE, ogFonts, ogMomo } from "@/lib/og";

export const runtime = "nodejs";
export const alt = "NepaliEats - Find Authentic Nepali food across Australia";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
	const [fonts, momo] = await Promise.all([ogFonts(), ogMomo()]);
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
										<img
						alt=""
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
					<div style={{ display: "flex", fontSize: 40, fontWeight: 800 }}>
						<span style={{ color: OG.chili }}>Nepali</span>
						<span style={{ color: OG.ink }}>Eats</span>
					</div>
					<div
						style={{
							display: "flex",
							flexWrap: "wrap",
							fontSize: 54,
							fontWeight: 800,
							lineHeight: 1.14,
							marginTop: 18,
						}}
					>
						<span style={{ color: OG.ink }}>Find&nbsp;</span>
						<span style={{ color: OG.chili }}>Authentic Nepali food&nbsp;</span>
						<span style={{ color: OG.ink }}>across Australia</span>
					</div>
					<div style={{ display: "flex", marginTop: 28 }}>
						<div
							style={{
								display: "flex",
								background: OG.chili,
								color: OG.white,
								padding: "14px 26px",
								borderRadius: 999,
								fontSize: 25,
								fontWeight: 700,
							}}
						>
							400+ spots
						</div>
					</div>
					<div
						style={{
							display: "flex",
							marginTop: 26,
							fontSize: 27,
							fontWeight: 700,
							color: OG.marigold,
						}}
					>
						Find your momo people.
					</div>
				</div>
			</div>
		),
		{ ...size, fonts },
	);
}
