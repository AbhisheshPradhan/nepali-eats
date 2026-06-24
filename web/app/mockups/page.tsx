"use client";

/**
 * /mockups — scratch page for trying logo mockups.
 * "NepaliEats" wordmark: Nepali (red) stacked over Eats (black),
 * plus a few variations including dark backgrounds.
 * Each logo can be downloaded as a vector SVG (no raster images).
 */

const CHILI = "#e5392b";
const INK = "#2b1a12";
const CREAM = "#fffbf4";
const MARIGOLD = "#f5a623";
const WHITE = "#ffffff";
const BLACK = "#161616";
const FONT = "'Baloo 2', 'Trebuchet MS', system-ui, sans-serif";

type Variation = {
  id: string;
  label: string;
  bg: string;
  nepali: string;
  eats: string;
  layout: "stacked" | "inline";
  accent?: "underline" | "dot" | null;
  letterSpacing?: number; // em
};

const VARIATIONS: Variation[] = [
  {
    id: "stacked-cream",
    label: "Stacked · cream",
    bg: CREAM,
    nepali: CHILI,
    eats: INK,
    layout: "stacked",
  },
  {
    id: "stacked-cream-underline",
    label: "Stacked · cream · underline",
    bg: CREAM,
    nepali: CHILI,
    eats: INK,
    layout: "stacked",
    accent: "underline",
  },
  {
    id: "stacked-black",
    label: "Stacked · black",
    bg: BLACK,
    nepali: CHILI,
    eats: WHITE,
    layout: "stacked",
  },
  {
    id: "stacked-black-marigold",
    label: "Stacked · black · marigold Eats",
    bg: BLACK,
    nepali: CHILI,
    eats: MARIGOLD,
    layout: "stacked",
  },
  {
    id: "stacked-cream-tight",
    label: "Stacked · tight · wide track",
    bg: CREAM,
    nepali: CHILI,
    eats: INK,
    layout: "stacked",
    letterSpacing: 0.04,
  },
  {
    id: "inline-cream",
    label: "Inline · cream",
    bg: CREAM,
    nepali: CHILI,
    eats: INK,
    layout: "inline",
  },
  {
    id: "inline-black",
    label: "Inline · black",
    bg: BLACK,
    nepali: CHILI,
    eats: WHITE,
    layout: "inline",
    accent: "dot",
  },
];

// Font size used for rendering. Bigger = higher-res output; the layout is
// measured from the real glyph bounds so the text fills the frame either way.
const RENDER_FS = 240;

function applyFont(ctx: CanvasRenderingContext2D, v: Variation) {
  ctx.font = `800 ${RENDER_FS}px ${FONT}`;
  ctx.textBaseline = "alphabetic";
  // letterSpacing is em in our design tokens; canvas wants a CSS length.
  const lsPx = (v.letterSpacing ?? -0.02) * RENDER_FS;
  if ("letterSpacing" in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
      `${lsPx}px`;
  }
}

/**
 * Measure the variation against real glyph bounds and return its tight pixel
 * size plus a paint() that fills the bg and draws the wordmark. Padding is a
 * small fraction of the font size, so the text sits large in the frame.
 */
function layoutFor(v: Variation): {
  W: number;
  H: number;
  paint: (ctx: CanvasRenderingContext2D) => void;
} {
  const probe = document.createElement("canvas").getContext("2d")!;
  applyFont(probe, v);
  const padX = RENDER_FS * 0.14;
  const padY = RENDER_FS * 0.16;
  const mN = probe.measureText("Nepali");
  const mE = probe.measureText("Eats");

  if (v.layout === "inline") {
    const asc = Math.max(mN.actualBoundingBoxAscent, mE.actualBoundingBoxAscent);
    const desc = Math.max(
      mN.actualBoundingBoxDescent,
      mE.actualBoundingBoxDescent,
    );
    const dotSpace = v.accent === "dot" ? RENDER_FS * 0.2 : 0;
    const W = mN.width + mE.width + 2 * padX;
    const H = asc + desc + 2 * padY + dotSpace;
    const paint = (ctx: CanvasRenderingContext2D) => {
      ctx.fillStyle = v.bg;
      ctx.fillRect(0, 0, W, H);
      applyFont(ctx, v);
      ctx.textAlign = "left";
      const y = padY + asc;
      ctx.fillStyle = v.nepali;
      ctx.fillText("Nepali", padX, y);
      ctx.fillStyle = v.eats;
      ctx.fillText("Eats", padX + mN.width, y);
      if (v.accent === "dot") {
        ctx.beginPath();
        ctx.fillStyle = v.nepali;
        ctx.arc(W / 2, y + desc + RENDER_FS * 0.12, RENDER_FS * 0.05, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    return { W, H, paint };
  }

  // stacked
  const lineGap = RENDER_FS * 0.04;
  const underlineSpace = v.accent === "underline" ? RENDER_FS * 0.22 : 0;
  const contentW = Math.max(mN.width, mE.width);
  const W = contentW + 2 * padX;
  const H =
    mN.actualBoundingBoxAscent +
    mN.actualBoundingBoxDescent +
    lineGap +
    mE.actualBoundingBoxAscent +
    mE.actualBoundingBoxDescent +
    2 * padY +
    underlineSpace;
  const paint = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = v.bg;
    ctx.fillRect(0, 0, W, H);
    applyFont(ctx, v);
    ctx.textAlign = "center";
    const y1 = padY + mN.actualBoundingBoxAscent;
    const y2 =
      y1 + mN.actualBoundingBoxDescent + lineGap + mE.actualBoundingBoxAscent;
    ctx.fillStyle = v.nepali;
    ctx.fillText("Nepali", W / 2, y1);
    ctx.fillStyle = v.eats;
    ctx.fillText("Eats", W / 2, y2);
    if (v.accent === "underline") {
      const uw = contentW * 0.5;
      const uh = RENDER_FS * 0.085;
      ctx.fillStyle = v.nepali;
      ctx.beginPath();
      ctx.roundRect(
        W / 2 - uw / 2,
        y2 + mE.actualBoundingBoxDescent + RENDER_FS * 0.1,
        uw,
        uh,
        uh / 2,
      );
      ctx.fill();
    }
  };
  return { W, H, paint };
}

async function ensureFont() {
  try {
    await document.fonts.load(`800 ${RENDER_FS}px "Baloo 2"`);
    await document.fonts.ready;
  } catch {
    /* fonts API may be unavailable; carry on with whatever is loaded */
  }
}

function triggerDownload(canvas: HTMLCanvasElement, filename: string) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, "image/png");
}

/** Tight wordmark PNG at the logo's natural aspect ratio. */
async function downloadPng(v: Variation) {
  await ensureFont();
  const { W, H, paint } = layoutFor(v);
  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(W * scale);
  canvas.height = Math.ceil(H * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(scale, scale);
  paint(ctx);
  triggerDownload(canvas, `nepalieats-${v.id}.png`);
}

/**
 * Square 512x512 PNG for favicon use: the wordmark is centered and scaled to
 * fit (aspect ratio preserved, never stretched), with the variation's bg.
 */
async function downloadFavicon(v: Variation) {
  await ensureFont();
  const { W, H, paint } = layoutFor(v);

  // Render the wordmark tight, then letterbox it into the square.
  const tight = document.createElement("canvas");
  tight.width = Math.ceil(W);
  tight.height = Math.ceil(H);
  const tctx = tight.getContext("2d");
  if (!tctx) return;
  paint(tctx);

  const S = 512;
  const pad = S * 0.08;
  const radius = S * 0.2; // dumpling-round, matches the brand's rounded corners
  const square = document.createElement("canvas");
  square.width = S;
  square.height = S;
  const ctx = square.getContext("2d");
  if (!ctx) return;
  // Clip to a rounded square so the corners are transparent (rounded icon).
  ctx.beginPath();
  ctx.roundRect(0, 0, S, S, radius);
  ctx.clip();
  ctx.fillStyle = v.bg;
  ctx.fillRect(0, 0, S, S);
  const fit = Math.min((S - 2 * pad) / W, (S - 2 * pad) / H);
  const dw = W * fit;
  const dh = H * fit;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(tight, (S - dw) / 2, (S - dh) / 2, dw, dh);
  triggerDownload(square, `nepalieats-${v.id}-favicon.png`);
}

function LogoPreview({ v }: { v: Variation }) {
  const tracking = v.letterSpacing ? `${v.letterSpacing}em` : "-0.02em";
  if (v.layout === "inline") {
    return (
      <div className="relative flex items-center justify-center">
        <div
          className="font-display font-extrabold leading-none"
          style={{ fontSize: "clamp(2.25rem, 6vw, 3.5rem)", letterSpacing: tracking }}
        >
          <span style={{ color: v.nepali }}>Nepali</span>
          <span style={{ color: v.eats }}>Eats</span>
        </div>
        {v.accent === "dot" && (
          <span
            className="absolute -bottom-2 h-2 w-2 rounded-full"
            style={{ background: v.nepali }}
          />
        )}
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center">
      <div
        className="font-display font-extrabold leading-[0.92]"
        style={{ fontSize: "clamp(2.5rem, 7vw, 4rem)", letterSpacing: tracking }}
      >
        <span style={{ color: v.nepali }}>Nepali</span>
      </div>
      <div
        className="font-display font-extrabold leading-[0.92]"
        style={{ fontSize: "clamp(2.5rem, 7vw, 4rem)", letterSpacing: tracking }}
      >
        <span style={{ color: v.eats }}>Eats</span>
      </div>
      {v.accent === "underline" && (
        <span
          className="mt-3 h-[6px] w-24 rounded-full"
          style={{ background: v.nepali }}
        />
      )}
    </div>
  );
}

export default function MockupsPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <header className="mb-10">
        <p className="eyebrow text-ink-500">Mockups</p>
        <h1 className="font-display text-3xl font-extrabold text-ink-900">
          Logo lab
        </h1>
        <p className="mt-2 max-w-prose text-ink-700">
          NepaliEats wordmark variations. Nepali in red, Eats in black, plus a
          few on dark. Download a tight PNG (font baked in) or a square 512x512
          favicon with rounded corners (aspect ratio kept, never stretched).
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2">
        {VARIATIONS.map((v) => (
          <div
            key={v.id}
            className="overflow-hidden rounded-[22px] border border-paper-200 bg-paper-50 shadow-[0_6px_18px_rgba(43,26,18,0.10)]"
          >
            <div
              className="flex min-h-[220px] items-center justify-center p-8"
              style={{ background: v.bg }}
            >
              <LogoPreview v={v} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <span className="text-sm font-semibold text-ink-700">
                {v.label}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => downloadFavicon(v)}
                  className="rounded-xl border-2 border-paper-300 px-3 py-2 text-sm font-display font-bold text-ink-900 transition-colors hover:bg-paper-100"
                >
                  Favicon (square)
                </button>
                <button
                  type="button"
                  onClick={() => downloadPng(v)}
                  className="rounded-xl bg-chili-500 px-4 py-2 text-sm font-display font-bold text-white transition-colors hover:bg-chili-600"
                >
                  Download PNG
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
