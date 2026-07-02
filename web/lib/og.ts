// Shared helpers for the generated OG images (next/og). Server-only.
// Fonts + the default momo image are read from the repo (assets/), logos are
// fetched from R2 and re-encoded to PNG (satori can't decode webp).
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";

export const OG = {
	chili: "#E5392B",
	marigold: "#F5A623",
	ink: "#2B1A12",
	cream: "#FFFBF4",
	white: "#FFFFFF",
} as const;

let _fontBufs: Promise<[Buffer, Buffer]> | null = null;
function fontBufs() {
	if (!_fontBufs)
		_fontBufs = Promise.all([
			readFile(join(process.cwd(), "assets/fonts/Baloo2-700.ttf")),
			readFile(join(process.cwd(), "assets/fonts/Baloo2-800.ttf")),
		]);
	return _fontBufs;
}

export async function ogFonts() {
	const [b700, b800] = await fontBufs();
	return [
		{ name: "Baloo 2", data: b700, weight: 700 as const, style: "normal" as const },
		{ name: "Baloo 2", data: b800, weight: 800 as const, style: "normal" as const },
	];
}

let _momo: Promise<string> | null = null;
// The default / fallback momo image as a base64 data URL.
export function ogMomo(): Promise<string> {
	if (!_momo)
		_momo = readFile(join(process.cwd(), "assets/og-momo.jpg")).then(
			(buf) => `data:image/jpeg;base64,${buf.toString("base64")}`,
		);
	return _momo;
}

// Fetch a remote image (any format incl. webp) and return a PNG data URL that
// satori can render, sized to fit within maxDim. Returns null on any failure so
// callers fall back to the momo image.
export async function pngDataUrl(
	url: string | null,
	maxDim = 460,
): Promise<string | null> {
	if (!url) return null;
	try {
		const res = await fetch(url);
		if (!res.ok) return null;
		const input = Buffer.from(await res.arrayBuffer());
		const out = await sharp(input)
			.resize(maxDim, maxDim, { fit: "inside", withoutEnlargement: true })
			.png()
			.toBuffer();
		return `data:image/png;base64,${out.toString("base64")}`;
	} catch {
		return null;
	}
}
