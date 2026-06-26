"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import {
	X,
	FloppyDisk,
	ImageSquare,
	ForkKnife,
	SlidersHorizontal,
	Star,
	Trash,
	CaretLeft,
	CaretRight,
	Plus,
	CircleNotch,
	Crop,
} from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { mediaUrl } from "@/lib/media";
import { parsePastedHours } from "@/lib/admin/parseHours";
import { CropModal } from "@/components/admin/CropModal";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
	SheetFooter,
} from "@/components/shadcn/sheet";
import {
	Tabs,
	TabsList,
	TabsTrigger,
	TabsContent,
} from "@/components/shadcn/tabs";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/shadcn/select";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Textarea } from "@/components/shadcn/textarea";
import { Label } from "@/components/shadcn/label";
import { useConfirm } from "@/components/shadcn/use-confirm";
import type { RestaurantDetail, OpeningHours, VenueType } from "@/lib/types";
import type { AdminPhoto } from "@/lib/admin/queries";

const DAYS: [keyof OpeningHours & string, string][] = [
	["mon", "Monday"],
	["tue", "Tuesday"],
	["wed", "Wednesday"],
	["thu", "Thursday"],
	["fri", "Friday"],
	["sat", "Saturday"],
	["sun", "Sunday"],
];
const VENUES: VenueType[] = [
	"Restaurant",
	"Café",
	"Takeaway",
	"Food Truck",
	"Caterer",
	"Dessert",
	"Bar",
];
const PRICE: [string, string][] = [
	["1", "$ (under $20)"],
	["2", "$$ ($20–40)"],
	["3", "$$$ ($40–60)"],
	["4", "$$$$ ($60+)"],
];
// Radix Select can't use "" as an item value, so an explicit clear option needs
// a sentinel that we map back to "" on change.
const NONE = "__none__";

const minToHHMM = (m: number) => {
	const t = ((m % 1440) + 1440) % 1440;
	return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(
		t % 60,
	).padStart(2, "0")}`;
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
			out[key] = {
				closed: false,
				slots: v.map(([o, c]) => ({
					open: minToHHMM(o),
					close: minToHHMM(c),
				})),
			};
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

type Tab = "general" | "photos" | "menu";

// The inline "Edit Restaurant" drawer (shadcn Sheet). General holds every batched
// field behind one Save (a single PATCH); Photos and Menu are instant uploads.
//
// All writes hit /api/admin/restaurants/[slug], gated by Clerk auth +
// ADMIN_USER_IDS (proxy.ts middleware + per-route requireAdmin).
export function RestaurantEditPanel({
	restaurant,
	open,
	onClose,
}: {
	restaurant: RestaurantDetail;
	open: boolean;
	onClose: () => void;
}) {
	const router = useRouter();
	const { confirm, confirmDialog } = useConfirm();
	const slug = restaurant.slug;
	const base = `/api/admin/restaurants/${slug}`;

	const [tab, setTab] = useState<Tab>("general");

	// Sliding underline: a single bar that animates to the active tab's position
	// (replaces the per-tab fade). Measured off the active trigger.
	const listRef = useRef<HTMLDivElement | null>(null);
	const [indicator, setIndicator] = useState({ left: 0, width: 0 });
	const measure = useCallback(() => {
		const active = listRef.current?.querySelector<HTMLElement>(
			'[data-state="active"]',
		);
		if (active && active.offsetWidth)
			setIndicator({
				left: active.offsetLeft,
				width: active.offsetWidth,
			});
	}, []);
	// Callback ref: measure the moment the list mounts (the Sheet's open animation
	// means a plain effect can fire before layout exists), then on tab + resize.
	const setListRef = useCallback(
		(node: HTMLDivElement | null) => {
			listRef.current = node;
			if (node) requestAnimationFrame(measure);
		},
		[measure],
	);
	useEffect(() => {
		requestAnimationFrame(measure);
		window.addEventListener("resize", measure);
		return () => window.removeEventListener("resize", measure);
	}, [tab, open, measure]);

	// ---- batched General form ----
	const [form, setForm] = useState({
		name: restaurant.name ?? "",
		description: restaurant.description ?? "",
		venueType: restaurant.venueType ?? "",
		tags: restaurant.tags.join(", "),
		priceLevel: String(restaurant.priceLevel ?? ""),
		phone: restaurant.phone ?? "",
		website: restaurant.website ?? "",
		email: restaurant.email ?? "",
		menuUrl: restaurant.menuUrl ?? "",
		facebook: restaurant.facebook ?? "",
		instagram: restaurant.instagram ?? "",
		tiktok: restaurant.tiktok ?? "",
		whatsapp: restaurant.whatsapp ?? "",
	});
	const [hours, setHours] = useState(() =>
		initHours(restaurant.openingHours),
	);
	const [hoursPaste, setHoursPaste] = useState("");
	const [dirty, setDirty] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const set = (k: keyof typeof form, v: string) => {
		setForm((f) => ({ ...f, [k]: v }));
		setDirty(true);
	};

	// ---- media (instant) ----
	const [photos, setPhotos] = useState<AdminPhoto[]>([]);
	const [menuFiles, setMenuFiles] = useState<string[]>([]);
	const [cover, setCover] = useState<string | null>(restaurant.coverKey);
	const [logo, setLogo] = useState<string | null>(restaurant.logoKey);
	const [mediaLoaded, setMediaLoaded] = useState(false);
	const [busy, setBusy] = useState<string | null>(null);
	const [cropper, setCropper] = useState<{
		src: string;
		aspect: number;
		title: string;
		revoke?: string;
		onConfirm: (blob: Blob) => Promise<void>;
	} | null>(null);

	// Load the editor's photos + menu files once when the drawer first opens.
	useEffect(() => {
		if (!open || mediaLoaded) return;
		let active = true;
		api(`${base}/editor`, { method: "GET" })
			.then((d) => {
				if (!active) return;
				setPhotos(d.photos ?? []);
				setMenuFiles(d.menuFiles ?? []);
				setMediaLoaded(true);
			})
			.catch(() => {});
		return () => {
			active = false;
		};
	}, [open, mediaLoaded, base]);

	const fail = (e: unknown) =>
		toast.error(e instanceof Error ? e.message : "Something went wrong");
	function closeCrop() {
		setCropper((c) => {
			if (c?.revoke) URL.revokeObjectURL(c.revoke);
			return null;
		});
	}

	async function attemptClose() {
		if (
			dirty &&
			!(await confirm({
				title: "Discard unsaved changes?",
				description: "Your edits on this tab haven't been saved.",
				confirmText: "Discard",
				destructive: true,
			}))
		)
			return;
		onClose();
	}

	// ---- the one Save: every General field in a single PATCH ----
	async function save() {
		if (!form.name.trim()) {
			setError("Name can't be empty.");
			setTab("general");
			return;
		}
		setSaving(true);
		setError(null);
		const out: OpeningHours = {};
		for (const [key] of DAYS) {
			const d = hours[key];
			if (d.closed) out[key] = [];
			else if (d.slots.length)
				out[key] = d.slots.map(({ open, close }) => {
					const o = hhmmToMin(open);
					let c = hhmmToMin(close);
					if (c <= o) c += 1440; // past midnight
					return [o, c];
				});
		}
		try {
			await api(base, {
				method: "PATCH",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					name: form.name.trim(),
					description: form.description.trim(),
					venueType: form.venueType,
					tags: form.tags
						.split(",")
						.map((t) => t.trim())
						.filter(Boolean),
					priceLevel: form.priceLevel === "" ? null : form.priceLevel,
					phone: form.phone,
					website: form.website,
					email: form.email,
					menuUrl: form.menuUrl,
					facebook: form.facebook,
					instagram: form.instagram,
					tiktok: form.tiktok,
					whatsapp: form.whatsapp,
					openingHours: out,
				}),
			});
			setDirty(false);
			toast.success("Saved");
			router.refresh();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Save failed");
		} finally {
			setSaving(false);
		}
	}

	// ---- media handlers (instant) ----
	async function uploadPhotos(files: FileList | null) {
		if (!files?.length) return;
		setBusy("photos");
		const fd = new FormData();
		Array.from(files).forEach((f) => fd.append("file", f));
		try {
			const data = await api(`${base}/photos`, {
				method: "POST",
				body: fd,
			});
			setPhotos(data.photos);
			toast.success("Photos uploaded");
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
		setPhotos(next);
		try {
			const data = await api(`${base}/photos`, {
				method: "PATCH",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ order: next.map((p) => p.id) }),
			});
			setPhotos(data.photos);
			router.refresh();
		} catch (e) {
			setPhotos(prev);
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
			setPhotos((ps) =>
				ps.map((p) => ({ ...p, isPrimary: p.id === id })),
			);
			router.refresh();
		} catch (e) {
			fail(e);
		}
	}
	async function deletePhoto(id: number) {
		if (
			!(await confirm({
				title: "Delete this photo?",
				confirmText: "Delete",
				destructive: true,
			}))
		)
			return;
		try {
			await api(`/api/admin/photos/${id}`, { method: "DELETE" });
			setPhotos((ps) => ps.filter((p) => p.id !== id));
			router.refresh();
		} catch (e) {
			fail(e);
		}
	}
	function reframePhoto(p: AdminPhoto) {
		// Load through the same-origin admin proxy, not the cross-origin R2 URL:
		// the cropper draws to a <canvas> for export, which CORS would block.
		const src = `/api/admin/media?key=${encodeURIComponent(p.storageKey)}`;
		if (!p.storageKey) return;
		setCropper({
			src,
			aspect: 4 / 3,
			title: "Re-frame photo (4:3)",
			onConfirm: async (blob) => {
				setBusy("photos");
				const fd = new FormData();
				fd.append("file", blob, "photo.jpg");
				try {
					const data = await api(`/api/admin/photos/${p.id}`, {
						method: "PUT",
						body: fd,
					});
					setPhotos((ps) =>
						ps.map((q) =>
							q.id === p.id
								? { ...q, storageKey: data.storageKey }
								: q,
						),
					);
					closeCrop();
					toast.success("Photo re-framed");
					router.refresh();
				} catch (e) {
					fail(e);
				} finally {
					setBusy(null);
				}
			},
		});
	}
	// Shared by upload + re-frame: POST the cropped 16:9 blob as the new cover.
	async function uploadCoverBlob(blob: Blob) {
		setBusy("cover");
		const fd = new FormData();
		fd.append("file", blob, "cover.jpg");
		try {
			const data = await api(`${base}/cover`, {
				method: "POST",
				body: fd,
			});
			setCover(data.coverKey);
			closeCrop();
			toast.success("Cover saved");
			router.refresh();
		} catch (e) {
			fail(e);
		} finally {
			setBusy(null);
		}
	}
	function openCoverCrop(file: File | null) {
		if (!file) return;
		const url = URL.createObjectURL(file);
		setCropper({
			src: url,
			aspect: 16 / 9,
			title: "Crop cover photo (16:9)",
			revoke: url,
			onConfirm: uploadCoverBlob,
		});
	}
	// Re-frame the current cover. Load it through the same-origin proxy (not the
	// cross-origin R2 URL, which CORS would block from canvas export).
	function reframeCover() {
		if (!cover) return;
		setCropper({
			src: `/api/admin/media?key=${encodeURIComponent(cover)}`,
			aspect: 16 / 9,
			title: "Re-frame cover photo (16:9)",
			onConfirm: uploadCoverBlob,
		});
	}
	async function removeCover() {
		if (
			!(await confirm({
				title: "Remove cover photo?",
				confirmText: "Remove",
				destructive: true,
			}))
		)
			return;
		try {
			await api(`${base}/cover`, { method: "DELETE" });
			setCover(null);
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
			const data = await api(`${base}/logo`, {
				method: "POST",
				body: fd,
			});
			setLogo(data.logoKey);
			toast.success("Logo uploaded");
			router.refresh();
		} catch (e) {
			fail(e);
		} finally {
			setBusy(null);
		}
	}
	async function removeLogo() {
		if (
			!(await confirm({
				title: "Remove logo?",
				confirmText: "Remove",
				destructive: true,
			}))
		)
			return;
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
			const data = await api(`${base}/menu`, {
				method: "POST",
				body: fd,
			});
			setMenuFiles(data.files ?? []);
			set("menuUrl", data.menuUrl ?? "");
			toast.success("Menu uploaded");
			router.refresh();
		} catch (e) {
			fail(e);
		} finally {
			setBusy(null);
		}
	}
	async function deleteMenuFile(key: string) {
		if (
			!(await confirm({
				title: "Delete this menu file?",
				confirmText: "Delete",
				destructive: true,
			}))
		)
			return;
		setBusy("menu");
		try {
			const data = await api(`${base}/menu`, {
				method: "DELETE",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ key }),
			});
			setMenuFiles(data.files ?? []);
			set("menuUrl", data.menuUrl ?? "");
			toast.success("Menu file deleted");
			router.refresh();
		} catch (e) {
			fail(e);
		} finally {
			setBusy(null);
		}
	}

	function parseHoursPaste() {
		const { hours: parsed, matched } = parsePastedHours(hoursPaste);
		if (!matched) {
			toast.error(
				"Couldn't read any days. Try lines like: Monday 11 am–9 pm",
			);
			return;
		}
		setHours((prev) => {
			const next = { ...prev };
			for (const [key, slots] of Object.entries(parsed)) {
				next[key] = slots.length
					? {
							closed: false,
							slots: slots.map(([o, c]) => ({
								open: minToHHMM(o),
								close: minToHHMM(c),
							})),
						}
					: { closed: true, slots: [] };
			}
			return next;
		});
		setDirty(true);
		toast.success(
			`Parsed ${matched} day${matched > 1 ? "s" : ""} — review, then Save`,
		);
	}

	function setDay(key: string, next: DayState) {
		setHours((h) => ({ ...h, [key]: next }));
		setDirty(true);
	}

	return (
		<Sheet
			open={open}
			onOpenChange={(o) => {
				if (!o) attemptClose();
			}}
		>
			<SheetContent
				side="right"
				showCloseButton={false}
				className="w-full sm:max-w-140 p-0 gap-0 bg-white"
			>
				{cropper && (
					<CropModal
						src={cropper.src}
						aspect={cropper.aspect}
						title={cropper.title}
						onCancel={closeCrop}
						onConfirm={cropper.onConfirm}
					/>
				)}
				{confirmDialog}

				{/* header */}
				<SheetHeader className="px-5 py-4 border-b border-border gap-0">
					<div className="flex items-center gap-3">
						<div className="min-w-0">
							<SheetTitle className="font-display font-extrabold text-lg text-foreground">
								Edit Restaurant
							</SheetTitle>
							<SheetDescription className="text-xs truncate">
								{restaurant.name}
							</SheetDescription>
						</div>
						<Button
							variant="ghost"
							size="icon"
							onClick={attemptClose}
							aria-label="Close"
							className="ml-auto rounded-full"
						>
							<X size={20} />
						</Button>
					</div>
				</SheetHeader>

				<Tabs
					value={tab}
					onValueChange={(v) => setTab(v as Tab)}
					className="flex-1 flex flex-col min-h-0 gap-0"
				>
					<TabsList
						ref={setListRef}
						variant="line"
						className="relative mt-4 w-full justify-start gap-6 px-5 border-b border-border"
					>
						<TabsTrigger
							value="general"
							className="after:hidden"
						>
							<SlidersHorizontal size={16} /> General
						</TabsTrigger>
						<TabsTrigger
							value="photos"
							className="after:hidden"
						>
							<ImageSquare size={16} /> Photos
						</TabsTrigger>
						<TabsTrigger
							value="menu"
							className="after:hidden"
						>
							<ForkKnife size={16} /> Menu
						</TabsTrigger>
						<span
							aria-hidden
							className="pointer-events-none absolute bottom-0 h-0.5 rounded-full bg-foreground transition-[left,width] duration-300 ease-out"
							style={{
								left: indicator.left,
								width: indicator.width,
							}}
						/>
					</TabsList>

					<div className="flex-1 overflow-y-auto px-5 py-5">
						<TabsContent
							value="general"
							className="mt-0 space-y-6"
						>
							<Group title="Details">
								<Field label="Name">
									<Input
										value={form.name}
										onChange={(e) =>
											set("name", e.target.value)
										}
									/>
								</Field>
								<Field label="Blurb">
									<Textarea
										value={form.description}
										onChange={(e) =>
											set("description", e.target.value)
										}
										rows={3}
										placeholder="A short, human blurb about this spot…"
										className="resize-y leading-relaxed"
									/>
								</Field>
								<div className="grid grid-cols-2 gap-3">
									<Field label="Venue type">
										<Select
											value={form.venueType || undefined}
											onValueChange={(v) =>
												set(
													"venueType",
													v === NONE ? "" : v,
												)
											}
										>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Unset" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value={NONE}>
													Unset
												</SelectItem>
												{VENUES.map((v) => (
													<SelectItem
														key={v}
														value={v}
													>
														{v}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</Field>
									<Field label="Price">
										<Select
											value={form.priceLevel || undefined}
											onValueChange={(v) =>
												set(
													"priceLevel",
													v === NONE ? "" : v,
												)
											}
										>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Not set" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value={NONE}>
													Not set
												</SelectItem>
												{PRICE.map(([v, l]) => (
													<SelectItem
														key={v}
														value={v}
													>
														{l}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</Field>
								</div>
								<Field label="Tags (comma separated)">
									<Input
										value={form.tags}
										onChange={(e) =>
											set("tags", e.target.value)
										}
										placeholder="e.g. momo, thakali"
									/>
								</Field>
							</Group>

							<Group title="Hours">
								<div className="space-y-1.5">
									{DAYS.map(([key, lbl]) => {
										const d = hours[key];
										return (
											<div
												key={key}
												className="flex items-center gap-2 text-sm"
											>
												<span className="w-24 shrink-0 text-foreground">
													{lbl}
												</span>
												{d.closed ? (
													<span className="text-muted-foreground italic flex-1">
														Closed
													</span>
												) : (
													<div className="flex-1 flex flex-wrap items-center gap-1.5">
														{d.slots.length ===
															0 && (
															<span className="text-muted-foreground italic">
																Unknown
															</span>
														)}
														{d.slots.map((s, i) => (
															<span
																key={i}
																className="inline-flex items-center gap-1"
															>
																<TimeField
																	value={
																		s.open
																	}
																	onChange={(
																		v,
																	) =>
																		setDay(
																			key,
																			{
																				...d,
																				slots: d.slots.map(
																					(
																						x,
																						j,
																					) =>
																						j ===
																						i
																							? {
																									...x,
																									open: v,
																								}
																							: x,
																				),
																			},
																		)
																	}
																/>
																<span className="text-muted-foreground">
																	–
																</span>
																<TimeField
																	value={
																		s.close
																	}
																	onChange={(
																		v,
																	) =>
																		setDay(
																			key,
																			{
																				...d,
																				slots: d.slots.map(
																					(
																						x,
																						j,
																					) =>
																						j ===
																						i
																							? {
																									...x,
																									close: v,
																								}
																							: x,
																				),
																			},
																		)
																	}
																/>
																<button
																	type="button"
																	onClick={() =>
																		setDay(
																			key,
																			{
																				...d,
																				slots: d.slots.filter(
																					(
																						_,
																						j,
																					) =>
																						j !==
																						i,
																				),
																			},
																		)
																	}
																	aria-label="Remove slot"
																	className="text-muted-foreground hover:text-primary cursor-pointer"
																>
																	<X
																		size={
																			13
																		}
																	/>
																</button>
															</span>
														))}
														<button
															type="button"
															onClick={() =>
																setDay(key, {
																	...d,
																	slots: [
																		...d.slots,
																		{
																			open: "09:00",
																			close: "17:00",
																		},
																	],
																})
															}
															aria-label="Add hours"
															className="inline-flex items-center text-muted-foreground hover:text-primary cursor-pointer"
														>
															<Plus size={14} />
														</button>
													</div>
												)}
												<button
													type="button"
													onClick={() =>
														setDay(
															key,
															d.closed
																? {
																		closed: false,
																		slots: [],
																	}
																: {
																		closed: true,
																		slots: [],
																	},
														)
													}
													className={cn(
														"shrink-0 text-xs px-2 py-1 rounded-md cursor-pointer transition-colors",
														d.closed
															? "bg-primary/10 text-primary"
															: "text-muted-foreground hover:bg-accent",
													)}
												>
													{d.closed
														? "Closed"
														: "Set closed"}
												</button>
											</div>
										);
									})}
								</div>
								<details className="mt-2">
									<summary className="text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground">
										Paste hours from Google
									</summary>
									<div className="mt-2 flex gap-2">
										<Textarea
											value={hoursPaste}
											onChange={(e) =>
												setHoursPaste(e.target.value)
											}
											rows={3}
											placeholder={
												"Monday 11 am–9 pm\nTuesday 11 am–9 pm…"
											}
											className="text-xs"
										/>
										<Button
											type="button"
											variant="secondary"
											onClick={parseHoursPaste}
											className="shrink-0 self-start"
										>
											Parse
										</Button>
									</div>
								</details>
							</Group>

							<Group title="Contact & links">
								{(
									[
										["phone", "Phone"],
										["website", "Website"],
										["email", "Email"],
										["facebook", "Facebook"],
										["instagram", "Instagram"],
										["tiktok", "TikTok"],
										["whatsapp", "WhatsApp"],
									] as [keyof typeof form, string][]
								).map(([k, lbl]) => (
									<Field
										key={k}
										label={lbl}
									>
										<Input
											value={form[k]}
											onChange={(e) =>
												set(k, e.target.value)
											}
										/>
									</Field>
								))}
							</Group>
						</TabsContent>

						<TabsContent
							value="photos"
							className="mt-0 space-y-6"
						>
							{!mediaLoaded ? (
								<Loading />
							) : (
								<>
									<Group title="Logo">
										<p className="text-xs text-muted-foreground -mt-1">
											Only shown in desktop view.
										</p>
										<div className="flex items-center gap-3">
											{logo && mediaUrl(logo) ? (
												<div className="relative w-16 h-16 rounded-full overflow-hidden bg-muted border border-border">
													<Image
														src={mediaUrl(logo)!}
														alt="Logo"
														fill
														className="object-cover"
														sizes="64px"
													/>
												</div>
											) : (
												<div className="w-16 h-16 rounded-full bg-muted grid place-items-center text-muted-foreground text-xs">
													None
												</div>
											)}
											<UploadButton
												label={
													logo
														? "Replace"
														: "Upload logo"
												}
												busy={busy === "logo"}
												accept="image/*"
												onFiles={(f) =>
													uploadLogo(f?.[0] ?? null)
												}
											/>
											{logo && (
												<Button
													variant="ghost"
													size="sm"
													onClick={removeLogo}
													className="text-muted-foreground"
												>
													Remove
												</Button>
											)}
										</div>
									</Group>

									<Group title="Cover photo">
										{cover ? (
											<div className="relative h-44 rounded-lg overflow-hidden bg-muted">
												{mediaUrl(cover) && (
													<Image
														src={mediaUrl(cover)!}
														alt="Cover"
														fill
														className="object-cover"
														sizes="520px"
													/>
												)}
												<div className="absolute top-2 right-2 flex gap-1.5">
													<Button
														variant="secondary"
														size="icon"
														onClick={reframeCover}
														aria-label="Re-frame cover"
														className="rounded-full"
													>
														<Crop size={16} />
													</Button>
													<Button
														variant="secondary"
														size="icon"
														onClick={removeCover}
														aria-label="Remove cover"
														className="rounded-full"
													>
														<Trash size={16} />
													</Button>
												</div>
											</div>
										) : (
											<p className="text-sm text-muted-foreground italic">
												No cover set — the primary photo
												is used.
											</p>
										)}
										<UploadButton
											label="Upload cover"
											busy={busy === "cover"}
											accept="image/*"
											onFiles={(f) =>
												openCoverCrop(f?.[0] ?? null)
											}
										/>
									</Group>

									<Group title="Gallery">
										{photos.length > 0 && (
											<div className="flex flex-wrap gap-3">
												{photos.map((p, i) => {
													const url = mediaUrl(
														p.storageKey,
													);
													return (
														<div
															key={p.id}
															className="w-36"
														>
															<div className="relative h-28 w-36 rounded-lg overflow-hidden bg-muted border border-border">
																{url && (
																	<Image
																		src={
																			url
																		}
																		alt=""
																		fill
																		className="object-cover"
																		sizes="144px"
																	/>
																)}
																{p.isPrimary && (
																	<span className="absolute top-1 left-1 bg-marigold-500 text-ink-900 text-[10px] font-bold px-1.5 py-0.5 rounded">
																		Primary
																	</span>
																)}
															</div>
															<div className="flex items-center justify-center gap-1 mt-1 text-muted-foreground">
																<button
																	type="button"
																	onClick={() =>
																		movePhoto(
																			i,
																			-1,
																		)
																	}
																	disabled={
																		i === 0
																	}
																	className="disabled:opacity-30 cursor-pointer disabled:cursor-default"
																>
																	<CaretLeft
																		size={
																			14
																		}
																	/>
																</button>
																{!p.isPrimary && (
																	<button
																		type="button"
																		onClick={() =>
																			makePrimary(
																				p.id,
																			)
																		}
																		title="Make primary"
																		className="text-marigold-600 cursor-pointer"
																	>
																		<Star
																			size={
																				14
																			}
																		/>
																	</button>
																)}
																<button
																	type="button"
																	onClick={() =>
																		reframePhoto(
																			p,
																		)
																	}
																	title="Re-frame"
																	className="text-[10px] font-semibold cursor-pointer"
																>
																	Crop
																</button>
																<button
																	type="button"
																	onClick={() =>
																		deletePhoto(
																			p.id,
																		)
																	}
																	title="Delete"
																	className="hover:text-primary cursor-pointer"
																>
																	<Trash
																		size={
																			13
																		}
																	/>
																</button>
																<button
																	type="button"
																	onClick={() =>
																		movePhoto(
																			i,
																			1,
																		)
																	}
																	disabled={
																		i ===
																		photos.length -
																			1
																	}
																	className="disabled:opacity-30 cursor-pointer disabled:cursor-default"
																>
																	<CaretRight
																		size={
																			14
																		}
																	/>
																</button>
															</div>
														</div>
													);
												})}
											</div>
										)}
										<UploadButton
											label="Upload photos"
											busy={busy === "photos"}
											accept="image/*"
											multiple
											onFiles={uploadPhotos}
										/>
									</Group>

								</>
							)}
						</TabsContent>

						<TabsContent
							value="menu"
							className="mt-0 space-y-6"
						>
							<Group title="Menu link">
								<Field label="Menu URL">
									<Input
										value={form.menuUrl}
										onChange={(e) =>
											set("menuUrl", e.target.value)
										}
										placeholder="https://…"
									/>
									<p className="text-xs text-muted-foreground mt-1.5">
										An external menu link, or the path of the
										uploaded file the page points at. Saved with
										the Save button.
									</p>
								</Field>
							</Group>
							{!mediaLoaded ? (
								<Loading />
							) : (
								<Group title="Menu files">
									<p className="text-xs text-muted-foreground">
										Upload menu photos or PDFs. These save
										instantly.
									</p>
									{menuFiles.length > 0 && (
										<ul className="space-y-2">
											{menuFiles.map((key) => {
												const href = mediaUrl(key);
												const onPage =
													form.menuUrl === key;
												return (
													<li
														key={key}
														className="flex items-center gap-2 text-sm bg-card rounded-lg border border-border px-3 py-2"
													>
														<ForkKnife
															size={16}
															className="text-muted-foreground shrink-0"
														/>
														<a
															href={href ?? "#"}
															target="_blank"
															rel="noopener noreferrer"
															className="truncate flex-1 text-foreground hover:text-primary hover:underline"
														>
															{key
																.split("/")
																.pop()}
														</a>
														{onPage && (
															<span className="shrink-0 text-[10px] font-bold bg-marigold-500 text-ink-900 px-1.5 py-0.5 rounded">
																On page
															</span>
														)}
														<button
															type="button"
															onClick={() =>
																deleteMenuFile(
																	key,
																)
															}
															className="text-muted-foreground hover:text-primary cursor-pointer"
														>
															<Trash size={15} />
														</button>
													</li>
												);
											})}
										</ul>
									)}
									<UploadButton
										label="Upload menu"
										busy={busy === "menu"}
										accept="image/*,application/pdf"
										multiple
										onFiles={uploadMenu}
									/>
								</Group>
							)}
						</TabsContent>
					</div>
				</Tabs>

				{/* footer: the one Save (governs General; media is instant) */}
				<SheetFooter className="flex-row items-center gap-3 px-5 py-3.5 border-t border-border">
					{error ? (
						<span className="text-sm text-primary font-medium">
							{error}
						</span>
					) : dirty ? (
						<span className="text-sm text-muted-foreground">
							Unsaved changes
						</span>
					) : (
						<span className="text-sm text-muted-foreground/70">
							All changes saved
						</span>
					)}
					<Button
						onClick={save}
						disabled={!dirty || saving}
						className="ml-auto"
					>
						{saving ? (
							<CircleNotch
								size={17}
								className="animate-spin"
							/>
						) : (
							<FloppyDisk
								size={17}
								weight="fill"
							/>
						)}
						Save changes
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}

// A compact, themed time picker (two small Selects) that replaces the native
// <input type="time"> and its OS wheel. Value is 24h "HH:MM"; minutes step by 5
// but always include the current value so imported odd minutes aren't lost.
function TimeField({
	value,
	onChange,
}: {
	value: string;
	onChange: (v: string) => void;
}) {
	const pad = (n: number) => String(n).padStart(2, "0");
	const [hh, mm] = value.split(":");
	const minutes = Array.from(
		new Set([...Array.from({ length: 12 }, (_, i) => i * 5), Number(mm)]),
	)
		.filter((n) => !Number.isNaN(n) && n >= 0 && n < 60)
		.sort((a, b) => a - b);

	return (
		<span className="inline-flex items-center gap-0.5">
			<Select
				value={hh || undefined}
				onValueChange={(h) => onChange(`${h}:${mm || "00"}`)}
			>
				<SelectTrigger
					size="sm"
					className="h-8 w-auto gap-1 px-2 text-xs"
				>
					<SelectValue placeholder="--" />
				</SelectTrigger>
				<SelectContent className="max-h-60">
					{Array.from({ length: 24 }, (_, i) => pad(i)).map((h) => (
						<SelectItem
							key={h}
							value={h}
						>
							{h}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<span className="text-muted-foreground">:</span>
			<Select
				value={mm || undefined}
				onValueChange={(m) => onChange(`${hh || "00"}:${m}`)}
			>
				<SelectTrigger
					size="sm"
					className="h-8 w-auto gap-1 px-2 text-xs"
				>
					<SelectValue placeholder="--" />
				</SelectTrigger>
				<SelectContent className="max-h-60">
					{minutes.map((n) => (
						<SelectItem
							key={n}
							value={pad(n)}
						>
							{pad(n)}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</span>
	);
}

function Group({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<section>
			<h3 className="font-display font-bold text-sm text-foreground mb-3">
				{title}
			</h3>
			<div className="space-y-3">{children}</div>
		</section>
	);
}

function Field({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div className="space-y-1.5">
			<Label className="text-xs font-semibold text-muted-foreground">
				{label}
			</Label>
			{children}
		</div>
	);
}

function Loading() {
	return (
		<div className="grid place-items-center py-10 text-muted-foreground">
			<CircleNotch
				size={24}
				className="animate-spin"
			/>
		</div>
	);
}

function UploadButton({
	label,
	busy,
	accept,
	multiple,
	onFiles,
}: {
	label: string;
	busy: boolean;
	accept: string;
	multiple?: boolean;
	onFiles: (files: FileList | null) => void;
}) {
	return (
		<label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-dashed border-input text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary cursor-pointer transition-colors w-fit">
			{busy ? (
				<CircleNotch
					size={16}
					className="animate-spin"
				/>
			) : (
				<Plus size={16} />
			)}
			{label}
			<input
				type="file"
				accept={accept}
				multiple={multiple}
				onChange={(e) => {
					onFiles(e.target.files);
					e.target.value = "";
				}}
				className="hidden"
			/>
		</label>
	);
}
