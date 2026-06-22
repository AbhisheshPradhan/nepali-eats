"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { mediaUrl } from "@/lib/media";
import { parsePastedHours } from "@/lib/admin/parseHours";
import { autoBlurb } from "@/lib/format";
import type { RestaurantDetail, OpeningHours, VenueType } from "@/lib/types";
import type { AdminPhoto } from "@/lib/admin/queries";

const DAYS: [keyof OpeningHours & string, string][] = [
  ["mon", "Mon"], ["tue", "Tue"], ["wed", "Wed"], ["thu", "Thu"],
  ["fri", "Fri"], ["sat", "Sat"], ["sun", "Sun"],
];
const VENUES: VenueType[] = ["Restaurant", "Café", "Takeaway", "Food Truck", "Caterer", "Dessert", "Bar"];
const HALAL = ["unknown", "certified", "options", "not_halal"];
// Auto-fill price range from price level ($ → $$$$). Editable afterwards.
const PRICE_RANGE: Record<string, string> = {
  "1": "$10-20",
  "2": "$20-40",
  "3": "$40-60",
  "4": "$60+",
};

const minToHHMM = (m: number) => {
  const t = ((m % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
};
const hhmmToMin = (s: string) => {
  const [h, m] = s.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

type DayState = { closed: boolean; slots: { open: string; close: string }[] };

function initHours(oh: OpeningHours | null): Record<string, DayState> {
  const out: Record<string, DayState> = {};
  for (const [key] of DAYS) {
    const v = oh?.[key];
    if (Array.isArray(v) && v.length)
      out[key] = { closed: false, slots: v.map(([o, c]) => ({ open: minToHHMM(o), close: minToHHMM(c) })) };
    else if (Array.isArray(v)) out[key] = { closed: true, slots: [] };
    else out[key] = { closed: false, slots: [] }; // unknown
  }
  return out;
}

async function api(url: string, opts: RequestInit) {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export function RestaurantEditor({
  restaurant,
  initialPhotos,
  initialMenuFiles,
}: {
  restaurant: RestaurantDetail;
  initialPhotos: AdminPhoto[];
  initialMenuFiles: string[];
}) {
  const router = useRouter();
  const slug = restaurant.slug;
  const base = `/api/admin/restaurants/${slug}`;

  // ---- details form ----
  const [form, setForm] = useState({
    name: restaurant.name ?? "",
    priceLevel: String(restaurant.priceLevel ?? ""),
    priceRange: restaurant.priceRange ?? "",
    venueType: restaurant.venueType ?? "",
    halalStatus: restaurant.halalStatus ?? "unknown",
    tags: restaurant.tags.join(", "),
    rating: String(restaurant.rating ?? ""),
    reviewCount: String(restaurant.reviewCount ?? ""),
    featuredRank: String(restaurant.featuredRank ?? ""),
    phone: restaurant.phone ?? "",
    email: restaurant.email ?? "",
    website: restaurant.website ?? "",
    menuUrl: restaurant.menuUrl ?? "",
    facebook: restaurant.facebook ?? "",
    instagram: restaurant.instagram ?? "",
    tiktok: restaurant.tiktok ?? "",
    whatsapp: restaurant.whatsapp ?? "",
  });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // ---- address / location form ----
  const [addr, setAddr] = useState({
    fullAddress: restaurant.fullAddress ?? "",
    street: restaurant.street ?? "",
    suburb: restaurant.suburb ?? "",
    state: restaurant.state ?? "",
    postcode: restaurant.postcode ?? "",
  });
  const setA = (k: keyof typeof addr, v: string) => setAddr((a) => ({ ...a, [k]: v }));

  const [popular, setPopular] = useState(restaurant.popular);
  const [hours, setHours] = useState(() => initHours(restaurant.openingHours));
  const [hoursPaste, setHoursPaste] = useState("");
  const [photos, setPhotos] = useState<AdminPhoto[]>(initialPhotos);
  const [menuFiles, setMenuFiles] = useState<string[]>(initialMenuFiles);
  const [menuUrl, setMenuUrl] = useState<string | null>(restaurant.menuUrl);
  const [markedReady, setMarkedReady] = useState(restaurant.markedReady);
  const [desc, setDesc] = useState(restaurant.description ?? "");
  const autoDesc = autoBlurb(restaurant);
  const [logo, setLogo] = useState<string | null>(restaurant.logoKey);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const flash = (msg: string) => {
    setNote(msg);
    setTimeout(() => setNote(null), 2500);
  };
  const fail = (e: unknown) => alert(e instanceof Error ? e.message : "Something went wrong");

  // Internal "ready" flag — saves immediately on toggle.
  async function toggleReady(next: boolean) {
    setMarkedReady(next); // optimistic
    try {
      await api(base, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ markedReady: next }),
      });
      flash(next ? "Marked ready" : "Marked not ready");
      router.refresh();
    } catch (e) {
      setMarkedReady(!next); // revert
      fail(e);
    }
  }

  async function saveDescription() {
    setBusy("description");
    try {
      await api(base, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ description: desc.trim() }),
      });
      flash(desc.trim() ? "Description saved" : "Description cleared (auto-generated)");
      router.refresh();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(null);
    }
  }

  async function saveAddress() {
    setBusy("address");
    try {
      await api(base, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fullAddress: addr.fullAddress,
          street: addr.street,
          suburb: addr.suburb,
          state: addr.state,
          postcode: addr.postcode,
        }),
      });
      flash("Address saved");
      router.refresh();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(null);
    }
  }

  async function saveDetails() {
    if (!form.name.trim()) {
      alert("Name can't be empty.");
      return;
    }
    setBusy("details");
    try {
      await api(base, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          priceLevel: form.priceLevel === "" ? null : form.priceLevel,
          priceRange: form.priceRange,
          venueType: form.venueType,
          halalStatus: form.halalStatus,
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
          rating: form.rating === "" ? null : form.rating,
          reviewCount: form.reviewCount === "" ? null : form.reviewCount,
          featuredRank: form.featuredRank === "" ? null : form.featuredRank,
          popular,
          phone: form.phone,
          email: form.email,
          website: form.website,
          menuUrl: form.menuUrl,
          facebook: form.facebook,
          instagram: form.instagram,
          tiktok: form.tiktok,
          whatsapp: form.whatsapp,
        }),
      });
      flash("Details saved");
      router.refresh();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(null);
    }
  }

  // Parse pasted free-text hours and fill the per-day inputs (review, then Save).
  function parseHoursPaste() {
    const { hours: parsed, matched } = parsePastedHours(hoursPaste);
    if (!matched) {
      alert("Couldn't read any days. Use lines like: Monday 11 am–9 pm");
      return;
    }
    setHours((prev) => {
      const next = { ...prev };
      for (const [key, slots] of Object.entries(parsed)) {
        next[key] = slots.length
          ? { closed: false, slots: slots.map(([o, c]) => ({ open: minToHHMM(o), close: minToHHMM(c) })) }
          : { closed: true, slots: [] };
      }
      return next;
    });
    flash(`Parsed ${matched} day${matched > 1 ? "s" : ""} — review, then Save hours`);
  }

  async function saveHours() {
    setBusy("hours");
    const out: OpeningHours = {};
    for (const [key] of DAYS) {
      const d = hours[key];
      if (d.closed) out[key] = [];
      else if (d.slots.length)
        out[key] = d.slots.map(({ open, close }) => {
          const o = hhmmToMin(open);
          let c = hhmmToMin(close);
          if (c <= o) c += 1440; // runs past midnight
          return [o, c];
        });
      // else: leave unknown (omit key)
    }
    try {
      await api(base, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ openingHours: out }),
      });
      flash("Hours saved");
      router.refresh();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(null);
    }
  }

  async function uploadPhotos(files: FileList | null) {
    if (!files?.length) return;
    setBusy("photos");
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("file", f));
    try {
      const data = await api(`${base}/photos`, { method: "POST", body: fd });
      setPhotos(data.photos);
      flash("Photos uploaded");
      router.refresh();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(null);
    }
  }

  async function movePhoto(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= photos.length) return;
    const prev = photos;
    const next = [...photos];
    [next[index], next[target]] = [next[target], next[index]];
    setPhotos(next); // optimistic
    try {
      const data = await api(`${base}/photos`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ order: next.map((p) => p.id) }),
      });
      setPhotos(data.photos);
      router.refresh();
    } catch (e) {
      setPhotos(prev); // revert
      fail(e);
    }
  }

  async function makePrimary(id: number) {
    try {
      await api(`/api/admin/photos/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ primary: true }),
      });
      setPhotos((ps) => ps.map((p) => ({ ...p, isPrimary: p.id === id })));
      router.refresh();
    } catch (e) {
      fail(e);
    }
  }

  async function deletePhoto(id: number) {
    if (!confirm("Delete this photo?")) return;
    try {
      await api(`/api/admin/photos/${id}`, { method: "DELETE" });
      setPhotos((ps) => ps.filter((p) => p.id !== id));
      router.refresh();
    } catch (e) {
      fail(e);
    }
  }

  async function uploadLogo(file: File | null) {
    if (!file) return;
    setBusy("logo");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const data = await api(`${base}/logo`, { method: "POST", body: fd });
      setLogo(data.logoKey);
      flash("Logo uploaded");
      router.refresh();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(null);
    }
  }

  async function removeLogo() {
    if (!confirm("Remove logo?")) return;
    try {
      await api(`${base}/logo`, { method: "DELETE" });
      setLogo(null);
      router.refresh();
    } catch (e) {
      fail(e);
    }
  }

  async function uploadMenu(files: FileList | null) {
    if (!files?.length) return;
    setBusy("menu");
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("file", f));
    try {
      const data = await api(`${base}/menu`, { method: "POST", body: fd });
      setMenuFiles(data.files ?? []);
      setMenuUrl(data.menuUrl ?? null);
      set("menuUrl", data.menuUrl ?? ""); // keep Details field in sync
      flash(files.length > 1 ? `${files.length} menu files uploaded` : "Menu uploaded");
      router.refresh();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(null);
    }
  }

  async function deleteMenuFile(key: string) {
    if (!confirm("Delete this menu file?")) return;
    setBusy("menu");
    try {
      const data = await api(`${base}/menu`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key }),
      });
      setMenuFiles(data.files ?? []);
      setMenuUrl(data.menuUrl ?? null);
      set("menuUrl", data.menuUrl ?? ""); // keep Details field in sync
      flash("Menu file deleted");
      router.refresh();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(null);
    }
  }

  const input = "border border-ink-200 rounded-md px-3 py-1.5 text-sm w-full";
  const label = "block text-xs font-semibold text-ink-500 mb-1";

  return (
    <div className="space-y-8">
      {note && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white text-sm px-4 py-2 rounded-md shadow">
          {note}
        </div>
      )}

      {/* READY FLAG (internal) — top of the editor, saves on toggle */}
      <label
        className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 cursor-pointer select-none transition-colors ${
          markedReady ? "border-emerald-400 bg-emerald-50" : "border-ink-200 bg-white"
        }`}
      >
        <input
          type="checkbox"
          checked={markedReady}
          onChange={(e) => toggleReady(e.target.checked)}
          className="h-5 w-5 accent-emerald-600"
        />
        <span className="font-display font-bold text-ink-900">Mark as ready</span>
        <span className="text-ink-500 text-sm">
          Data reviewed and ready to go live / for the next stage (e.g. menu parsing).
        </span>
      </label>

      {/* PHOTOS */}
      <Section title="Photos">
        <div className="flex flex-wrap gap-3 mb-3">
          {photos.map((p, i) => {
            const url = mediaUrl(p.storageKey);
            return (
              <div key={p.id} className="relative w-28">
                <div className="relative h-24 w-28 rounded-md overflow-hidden bg-paper-100 border border-ink-100">
                  {url && <Image src={url} alt="" fill className="object-cover" sizes="112px" />}
                </div>
                {p.isPrimary && (
                  <span className="absolute top-1 left-1 bg-marigold-500 text-ink-900 text-[10px] font-bold px-1.5 py-0.5 rounded">
                    Primary
                  </span>
                )}
                {/* reorder */}
                <div className="flex items-center justify-center gap-1 mt-1">
                  <button
                    onClick={() => movePhoto(i, -1)}
                    disabled={i === 0}
                    title="Move left"
                    className="px-2 py-0.5 rounded border border-ink-200 text-ink-600 hover:bg-paper-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ◀
                  </button>
                  <span className="text-[10px] text-ink-400 w-4 text-center">{i + 1}</span>
                  <button
                    onClick={() => movePhoto(i, 1)}
                    disabled={i === photos.length - 1}
                    title="Move right"
                    className="px-2 py-0.5 rounded border border-ink-200 text-ink-600 hover:bg-paper-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ▶
                  </button>
                </div>
                <div className="flex gap-2 mt-1 text-xs justify-center">
                  {!p.isPrimary && (
                    <button onClick={() => makePrimary(p.id)} className="text-chili-600 hover:underline">
                      Make primary
                    </button>
                  )}
                  <button onClick={() => deletePhoto(p.id)} className="text-ink-400 hover:text-red-600">
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
          {!photos.length && <p className="text-ink-400 text-sm">No photos yet.</p>}
        </div>
        <label className="inline-block text-sm">
          <span className="bg-ink-900 text-white rounded-md px-4 py-1.5 font-display font-bold cursor-pointer hover:bg-ink-800">
            {busy === "photos" ? "Uploading…" : "Upload photos"}
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => uploadPhotos(e.target.files)}
          />
        </label>
      </Section>

      {/* LOGO */}
      <Section title="Logo">
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-paper-100 border border-ink-100 grid place-items-center shrink-0">
            {logo ? (
              <Image
                src={mediaUrl(logo) || ""}
                alt="logo"
                fill
                className="object-contain p-1"
                sizes="80px"
                unoptimized
              />
            ) : (
              <span className="text-ink-300 text-xs">none</span>
            )}
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <label className="inline-block">
              <span className="bg-ink-900 text-white rounded-md px-4 py-1.5 font-display font-bold cursor-pointer hover:bg-ink-800">
                {busy === "logo" ? "Uploading…" : logo ? "Replace logo" : "Upload logo"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => uploadLogo(e.target.files?.[0] ?? null)}
              />
            </label>
            {logo && (
              <button onClick={removeLogo} className="text-ink-400 hover:text-red-600 text-left text-xs">
                Remove logo
              </button>
            )}
            <p className="text-ink-400 text-xs">PNG/SVG with transparency works best.</p>
          </div>
        </div>
      </Section>

      {/* DESCRIPTION */}
      <Section title="Description">
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          rows={4}
          placeholder={autoDesc}
          className="border border-ink-200 rounded-md px-3 py-2 text-sm w-full leading-relaxed"
        />
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={saveDescription}
            disabled={busy === "description"}
            className="bg-chili-500 text-white rounded-md px-5 py-1.5 font-display font-bold hover:bg-chili-600 disabled:opacity-50"
          >
            {busy === "description" ? "Saving…" : "Save description"}
          </button>
          {desc.trim() === "" ? (
            <span className="text-xs text-ink-400">
              Empty → auto-generated: <span className="italic">{autoDesc}</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setDesc("")}
              className="text-xs text-ink-400 hover:text-ink-700"
            >
              Clear (use auto-generated)
            </button>
          )}
        </div>
      </Section>

      {/* ADDRESS & LOCATION */}
      <Section title="Address & location">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <span className={label}>Full address</span>
            <input value={addr.fullAddress} onChange={(e) => setA("fullAddress", e.target.value)} className={input} />
          </div>
          <div className="col-span-2">
            <span className={label}>Street</span>
            <input value={addr.street} onChange={(e) => setA("street", e.target.value)} className={input} />
          </div>
          <div>
            <span className={label}>Suburb</span>
            <input value={addr.suburb} onChange={(e) => setA("suburb", e.target.value)} className={input} />
          </div>
          <div>
            <span className={label}>State</span>
            <input value={addr.state} onChange={(e) => setA("state", e.target.value)} placeholder="NSW" className={input} />
          </div>
          <div>
            <span className={label}>Postcode</span>
            <input value={addr.postcode} onChange={(e) => setA("postcode", e.target.value)} className={input} />
          </div>
        </div>
        <p className="text-ink-400 text-xs mt-2">
          Suburb and state drive directory filters and the city pages.
        </p>
        <button
          onClick={saveAddress}
          disabled={busy === "address"}
          className="mt-4 bg-chili-500 text-white rounded-md px-5 py-1.5 font-display font-bold hover:bg-chili-600 disabled:opacity-50"
        >
          {busy === "address" ? "Saving…" : "Save address"}
        </button>
      </Section>

      {/* DETAILS */}
      <Section title="Details">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <span className={label}>Name</span>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} className={input} />
          </div>
          <div>
            <span className={label}>Price level</span>
            <select
              value={form.priceLevel}
              onChange={(e) => {
                const v = e.target.value;
                setForm((f) => ({
                  ...f,
                  priceLevel: v,
                  priceRange: PRICE_RANGE[v] ?? f.priceRange,
                }));
              }}
              className={input}
            >
              <option value="">—</option>
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>{"$".repeat(n)}</option>
              ))}
            </select>
          </div>
          <div>
            <span className={label}>Price range (free text)</span>
            <input value={form.priceRange} onChange={(e) => set("priceRange", e.target.value)} placeholder="$10–20" className={input} />
          </div>
          <div>
            <span className={label}>Venue type</span>
            <select value={form.venueType} onChange={(e) => set("venueType", e.target.value)} className={input}>
              <option value="">—</option>
              {VENUES.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <span className={label}>Halal</span>
            <select value={form.halalStatus} onChange={(e) => set("halalStatus", e.target.value)} className={input}>
              {HALAL.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <div>
            <span className={label}>Tags (comma separated)</span>
            <input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="momo, thakali" className={input} />
          </div>
          <div>
            <span className={label}>Rating (0–5)</span>
            <input value={form.rating} onChange={(e) => set("rating", e.target.value)} type="number" min="0" max="5" step="0.1" className={input} />
          </div>
          <div>
            <span className={label}>Review count</span>
            <input value={form.reviewCount} onChange={(e) => set("reviewCount", e.target.value)} type="number" min="0" className={input} />
          </div>
          <div>
            <span className={label}>Featured rank (blank = not featured)</span>
            <input value={form.featuredRank} onChange={(e) => set("featuredRank", e.target.value)} type="number" className={input} />
          </div>
          <div>
            <span className={label}>Popular</span>
            <label className="flex items-center gap-2 text-sm text-ink-700 h-8.5">
              <input
                type="checkbox"
                checked={popular}
                onChange={(e) => setPopular(e.target.checked)}
                className="h-4 w-4 accent-chili-500"
              />
              Show a “Popular” tag on the card
            </label>
          </div>
          <div>
            <span className={label}>Phone</span>
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className={input} />
          </div>
          <div>
            <span className={label}>Website</span>
            <input value={form.website} onChange={(e) => set("website", e.target.value)} className={input} />
          </div>
          <div>
            <span className={label}>Email</span>
            <input value={form.email} onChange={(e) => set("email", e.target.value)} className={input} />
          </div>
          <div>
            <span className={label}>Menu link (external URL)</span>
            <input value={form.menuUrl} onChange={(e) => set("menuUrl", e.target.value)} className={input} />
          </div>
          <div>
            <span className={label}>Facebook</span>
            <input value={form.facebook} onChange={(e) => set("facebook", e.target.value)} placeholder="https://facebook.com/…" className={input} />
          </div>
          <div>
            <span className={label}>Instagram</span>
            <input value={form.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="https://instagram.com/…" className={input} />
          </div>
          <div>
            <span className={label}>TikTok</span>
            <input value={form.tiktok} onChange={(e) => set("tiktok", e.target.value)} placeholder="https://tiktok.com/@…" className={input} />
          </div>
          <div>
            <span className={label}>WhatsApp</span>
            <input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="https://wa.me/…" className={input} />
          </div>
        </div>
        <button
          onClick={saveDetails}
          disabled={busy === "details"}
          className="mt-4 bg-chili-500 text-white rounded-md px-5 py-1.5 font-display font-bold hover:bg-chili-600 disabled:opacity-50"
        >
          {busy === "details" ? "Saving…" : "Save details"}
        </button>
      </Section>

      {/* MENU FILES */}
      <Section title="Menu files (image or PDF)">
        {menuFiles.length > 0 ? (
          <ul className="mb-3 divide-y divide-ink-100 border border-ink-100 rounded-md">
            {menuFiles.map((key) => {
              const name = key.split("/").pop();
              return (
                <li key={key} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <a
                    href={mediaUrl(key) ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-chili-600 hover:underline break-all flex-1"
                  >
                    {name}
                  </a>
                  {menuUrl === key && (
                    <span className="text-[10px] font-bold bg-marigold-500 text-ink-900 px-1.5 py-0.5 rounded shrink-0">
                      On public page
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteMenuFile(key)}
                    disabled={busy === "menu"}
                    className="text-ink-400 hover:text-red-600 shrink-0 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-ink-400 text-sm mb-3">No menu files uploaded yet.</p>
        )}
        {/* External menu links (http) live in Details → "Menu link". This handles uploaded files. */}
        {menuUrl && menuUrl.startsWith("http") && (
          <p className="text-xs text-ink-400 mb-3">
            Public page currently uses an external menu link (see Details).
          </p>
        )}
        <label className="inline-block text-sm">
          <span className="bg-ink-900 text-white rounded-md px-4 py-1.5 font-display font-bold cursor-pointer hover:bg-ink-800">
            {busy === "menu" ? "Working…" : "Upload menu files"}
          </span>
          <input
            type="file"
            accept="image/*,application/pdf"
            multiple
            className="hidden"
            onChange={(e) => uploadMenu(e.target.files)}
          />
        </label>
        <p className="text-ink-400 text-xs mt-2">
          Select several at once. All are stored; the first becomes the one shown on the public page.
        </p>
      </Section>

      {/* HOURS */}
      <Section title="Opening hours">
        {/* Paste-to-fill: drop in text copied from Google and parse it. */}
        <div className="mb-4 rounded-md bg-paper-50 border border-ink-100 p-3">
          <span className={label}>Paste hours (e.g. from Google), then parse</span>
          <textarea
            value={hoursPaste}
            onChange={(e) => setHoursPaste(e.target.value)}
            rows={4}
            placeholder={"Monday\t11 am–9 pm\nTuesday\t11 am–9 pm\nSaturday\t12–9 pm\nSunday\tClosed"}
            className="border border-ink-200 rounded-md px-3 py-2 text-sm w-full font-mono"
          />
          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              onClick={parseHoursPaste}
              className="bg-ink-900 text-white rounded-md px-4 py-1.5 text-sm font-display font-bold hover:bg-ink-800"
            >
              Parse &amp; fill
            </button>
            {hoursPaste && (
              <button
                type="button"
                onClick={() => setHoursPaste("")}
                className="text-xs text-ink-400 hover:text-ink-700"
              >
                Clear
              </button>
            )}
            <span className="text-xs text-ink-400">
              Fills the rows below; review, then Save hours.
            </span>
          </div>
        </div>
        <p className="text-xs text-ink-400 mb-3">
          24h times. A close earlier than open is treated as past midnight. No rows + not Closed = left unknown.
        </p>
        <div className="space-y-2">
          {DAYS.map(([key, lbl]) => {
            const d = hours[key];
            const upd = (next: DayState) => setHours((h) => ({ ...h, [key]: next }));
            return (
              <div key={key} className="flex items-start gap-3">
                <span className="w-10 text-sm font-semibold text-ink-700 pt-1.5">{lbl}</span>
                <label className="flex items-center gap-1 text-xs text-ink-500 pt-2 w-20">
                  <input
                    type="checkbox"
                    checked={d.closed}
                    onChange={(e) => upd({ closed: e.target.checked, slots: e.target.checked ? [] : d.slots })}
                  />
                  Closed
                </label>
                {!d.closed && (
                  <div className="flex flex-col gap-1">
                    {d.slots.map((s, i) => (
                      <div key={i} className="flex items-center gap-1 text-sm">
                        <input
                          type="time"
                          value={s.open}
                          onChange={(e) => {
                            const slots = [...d.slots];
                            slots[i] = { ...slots[i], open: e.target.value };
                            upd({ ...d, slots });
                          }}
                          className="border border-ink-200 rounded px-2 py-1"
                        />
                        <span className="text-ink-400">–</span>
                        <input
                          type="time"
                          value={s.close}
                          onChange={(e) => {
                            const slots = [...d.slots];
                            slots[i] = { ...slots[i], close: e.target.value };
                            upd({ ...d, slots });
                          }}
                          className="border border-ink-200 rounded px-2 py-1"
                        />
                        <button
                          onClick={() => upd({ ...d, slots: d.slots.filter((_, j) => j !== i) })}
                          className="text-ink-400 hover:text-red-600 px-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => upd({ ...d, slots: [...d.slots, { open: "09:00", close: "17:00" }] })}
                      className="text-xs text-chili-600 hover:underline text-left"
                    >
                      + add hours
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <button
          onClick={saveHours}
          disabled={busy === "hours"}
          className="mt-4 bg-chili-500 text-white rounded-md px-5 py-1.5 font-display font-bold hover:bg-chili-600 disabled:opacity-50"
        >
          {busy === "hours" ? "Saving…" : "Save hours"}
        </button>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-lg border border-ink-100 p-5">
      <h2 className="font-display font-extrabold text-lg text-ink-900 mb-3">{title}</h2>
      {children}
    </section>
  );
}
