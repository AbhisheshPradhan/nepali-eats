"use client";

// LOCAL-ONLY admin media triage. A prioritised, keyboard-driven feed for ripping
// through photo QA (flag junk, set cover/logo, add) and menu uploads across many
// restaurants. All actions are optimistic and reuse the existing admin routes.
import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type DragEvent,
} from "react";
import Link from "next/link";
import {
	Trash,
	Star,
	X,
	ArrowSquareOut,
	UploadSimple,
	Check,
	FilePdf,
} from "@phosphor-icons/react";
import { mediaUrl } from "@/lib/media";
import type {
	TriageItem,
	TriagePhoto,
	TriageMode,
	AdminPhoto,
} from "@/lib/admin/queries";

async function api(url: string, opts: RequestInit) {
	const res = await fetch(url, opts);
	if (!res.ok) {
		const e = await res.json().catch(() => ({}));
		throw new Error(e.error || `Request failed (${res.status})`);
	}
	return res.json();
}

function sourceBadge(source: string | null) {
	const s = source ?? "unknown";
	const tone =
		s === "upload"
			? "bg-emerald-50 text-emerald-700"
			: s === "google"
				? "bg-amber-100 text-amber-800"
				: s === "website"
					? "bg-sky-50 text-sky-700"
					: "bg-ink-100 text-ink-500";
	return (
		<span
			className={`px-1.5 py-0.5 rounded text-[10px] font-display font-bold uppercase tracking-wide ${tone}`}
		>
			{s}
		</span>
	);
}

export function TriageClient({
	initialItems,
	mode,
	state,
	hideReviewed,
	pageSize,
}: {
	initialItems: TriageItem[];
	mode: TriageMode;
	state: string | null;
	hideReviewed: boolean;
	pageSize: number;
}) {
	const [list, setList] = useState<TriageItem[]>(initialItems);
	const [flagged, setFlagged] = useState<Set<number>>(new Set());
	const [focusCard, setFocusCard] = useState(0);
	const [focusPhoto, setFocusPhoto] = useState(0);
	const [busy, setBusy] = useState<number | null>(null);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(initialItems.length === pageSize);
	const [loadingMore, setLoadingMore] = useState(false);

	const cardEls = useRef<(HTMLDivElement | null)[]>([]);
	const sentinel = useRef<HTMLDivElement | null>(null);

	// Snapshot the latest state for the (stable) keyboard handler.
	const snap = useRef({ list, flagged, focusCard, focusPhoto, mode, busy });
	useEffect(() => {
		snap.current = { list, flagged, focusCard, focusPhoto, mode, busy };
	});

	const toast = useCallback((msg: string) => window.alert(msg), []);

	// ---- actions ----
	const deleteFlaggedFor = useCallback(
		async (item: TriageItem) => {
			const ids = item.photos
				.map((p) => p.id)
				.filter((id) => snap.current.flagged.has(id));
			if (!ids.length) return;
			setBusy(item.id);
			try {
				await Promise.all(
					ids.map((id) =>
						api(`/api/admin/photos/${id}`, { method: "DELETE" })
					)
				);
				setList((l) =>
					l.map((it) =>
						it.id === item.id
							? { ...it, photos: it.photos.filter((p) => !ids.includes(p.id)) }
							: it
					)
				);
				setFlagged((f) => {
					const n = new Set(f);
					ids.forEach((id) => n.delete(id));
					return n;
				});
				setFocusPhoto(0);
			} catch (err) {
				toast(err instanceof Error ? err.message : "Delete failed");
			} finally {
				setBusy(null);
			}
		},
		[toast]
	);

	// Patch one item's fields in the list (cover/logo updates).
	const patchItem = useCallback((id: number, fields: Partial<TriageItem>) => {
		setList((l) => l.map((it) => (it.id === id ? { ...it, ...fields } : it)));
	}, []);

	// Promote an existing gallery photo to the standalone cover/hero.
	const setCoverFromPhoto = useCallback(
		async (item: TriageItem, photoId: number) => {
			setBusy(item.id);
			try {
				const res = (await api(`/api/admin/restaurants/${item.slug}/cover`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ fromPhotoId: photoId }),
				})) as { coverKey: string };
				patchItem(item.id, { coverKey: res.coverKey });
			} catch (err) {
				toast(err instanceof Error ? err.message : "Could not set cover");
			} finally {
				setBusy(null);
			}
		},
		[toast, patchItem]
	);

	// Upload a fresh cover or logo (multipart). slot picks the route + field.
	const uploadBrand = useCallback(
		async (item: TriageItem, slot: "cover" | "logo", file: File) => {
			if (!file.type.startsWith("image/")) return;
			setBusy(item.id);
			try {
				const fd = new FormData();
				fd.append("file", file);
				const res = (await api(`/api/admin/restaurants/${item.slug}/${slot}`, {
					method: "POST",
					body: fd,
				})) as { coverKey?: string; logoKey?: string };
				patchItem(
					item.id,
					slot === "cover"
						? { coverKey: res.coverKey ?? null }
						: { logoKey: res.logoKey ?? null }
				);
			} catch (err) {
				toast(err instanceof Error ? err.message : "Upload failed");
			} finally {
				setBusy(null);
			}
		},
		[toast, patchItem]
	);

	const clearBrand = useCallback(
		async (item: TriageItem, slot: "cover" | "logo") => {
			setBusy(item.id);
			try {
				await api(`/api/admin/restaurants/${item.slug}/${slot}`, {
					method: "DELETE",
				});
				patchItem(item.id, slot === "cover" ? { coverKey: null } : { logoKey: null });
			} catch (err) {
				toast(err instanceof Error ? err.message : "Could not clear");
			} finally {
				setBusy(null);
			}
		},
		[toast, patchItem]
	);

	const addPhotos = useCallback(
		async (item: TriageItem, files: FileList | File[]) => {
			const imgs = Array.from(files).filter((f) => f.type.startsWith("image/"));
			if (!imgs.length) return;
			setBusy(item.id);
			try {
				const fd = new FormData();
				imgs.forEach((f) => fd.append("file", f));
				const res = (await api(
					`/api/admin/restaurants/${item.slug}/photos`,
					{ method: "POST", body: fd }
				)) as { photos: AdminPhoto[] };
				const photos: TriagePhoto[] = res.photos.map((p) => ({
					id: p.id,
					key: p.storageKey,
					source: "upload",
					isPrimary: p.isPrimary,
				}));
				setList((l) =>
					l.map((it) => (it.id === item.id ? { ...it, photos } : it))
				);
			} catch (err) {
				toast(err instanceof Error ? err.message : "Upload failed");
			} finally {
				setBusy(null);
			}
		},
		[toast]
	);

	const markReviewed = useCallback(
		async (item: TriageItem) => {
			setBusy(item.id);
			try {
				await api(`/api/admin/restaurants/${item.slug}/reviewed`, {
					method: "POST",
				});
				if (hideReviewed) {
					setList((l) => l.filter((it) => it.id !== item.id));
				} else {
					setList((l) =>
						l.map((it) =>
							it.id === item.id
								? { ...it, photosReviewedAt: new Date().toISOString() }
								: it
						)
					);
					setFocusCard((i) => i + 1);
				}
			} catch (err) {
				toast(err instanceof Error ? err.message : "Could not mark reviewed");
			} finally {
				setBusy(null);
			}
		},
		[hideReviewed, toast]
	);

	const uploadMenu = useCallback(
		async (item: TriageItem, files: FileList | File[]) => {
			const ok = Array.from(files).filter(
				(f) => f.type.startsWith("image/") || f.type === "application/pdf"
			);
			if (!ok.length) return;
			setBusy(item.id);
			try {
				const fd = new FormData();
				ok.forEach((f) => fd.append("file", f));
				const res = (await api(
					`/api/admin/restaurants/${item.slug}/menu`,
					{ method: "POST", body: fd }
				)) as { menuUrl: string | null; files: string[] };
				setList((l) =>
					l.map((it) =>
						it.id === item.id
							? { ...it, menuUrl: res.menuUrl, menuFiles: res.files }
							: it
					)
				);
			} catch (err) {
				toast(err instanceof Error ? err.message : "Upload failed");
			} finally {
				setBusy(null);
			}
		},
		[toast]
	);

	const deleteMenuFile = useCallback(
		async (item: TriageItem, key: string) => {
			setBusy(item.id);
			try {
				const res = (await api(
					`/api/admin/restaurants/${item.slug}/menu`,
					{
						method: "DELETE",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ key }),
					}
				)) as { menuUrl: string | null; files: string[] };
				setList((l) =>
					l.map((it) =>
						it.id === item.id
							? { ...it, menuUrl: res.menuUrl, menuFiles: res.files }
							: it
					)
				);
			} catch (err) {
				toast(err instanceof Error ? err.message : "Delete failed");
			} finally {
				setBusy(null);
			}
		},
		[toast]
	);

	const toggleFlag = useCallback((photoId: number) => {
		setFlagged((f) => {
			const n = new Set(f);
			if (n.has(photoId)) n.delete(photoId);
			else n.add(photoId);
			return n;
		});
	}, []);

	// ---- load more ----
	const loadMore = useCallback(async () => {
		if (loadingMore || !hasMore) return;
		setLoadingMore(true);
		try {
			const qs = new URLSearchParams();
			if (mode !== "photo") qs.set("mode", mode);
			if (state) qs.set("state", state);
			if (!hideReviewed) qs.set("hideReviewed", "0");
			qs.set("page", String(page + 1));
			const res = (await api(`/api/admin/triage?${qs}`, { method: "GET" })) as {
				items: TriageItem[];
				hasMore: boolean;
			};
			setList((l) => {
				const seen = new Set(l.map((x) => x.id));
				return [...l, ...res.items.filter((x) => !seen.has(x.id))];
			});
			setPage((p) => p + 1);
			setHasMore(res.hasMore);
		} catch {
			setHasMore(false);
		} finally {
			setLoadingMore(false);
		}
	}, [loadingMore, hasMore, mode, state, hideReviewed, page]);

	// Infinite scroll sentinel.
	useEffect(() => {
		const el = sentinel.current;
		if (!el) return;
		const io = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) loadMore();
			},
			{ rootMargin: "600px" }
		);
		io.observe(el);
		return () => io.disconnect();
	}, [loadMore]);

	// Keep focus in range as the list shrinks/grows.
	useEffect(() => {
		setFocusCard((i) => Math.min(i, Math.max(0, list.length - 1)));
	}, [list.length]);

	// Scroll the focused card into view.
	useEffect(() => {
		cardEls.current[focusCard]?.scrollIntoView({
			block: "nearest",
			behavior: "smooth",
		});
	}, [focusCard]);

	// ---- keyboard ----
	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			const t = e.target as HTMLElement;
			if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
			const s = snap.current;
			const item = s.list[s.focusCard];
			const move = (d: number) =>
				setFocusCard((i) => Math.max(0, Math.min(s.list.length - 1, i + d)));

			switch (e.key) {
				case "j":
				case "ArrowDown":
					e.preventDefault();
					move(1);
					setFocusPhoto(0);
					break;
				case "k":
				case "ArrowUp":
					e.preventDefault();
					move(-1);
					setFocusPhoto(0);
					break;
				case "h":
				case "ArrowLeft":
					if (s.mode !== "photo" || !item) return;
					e.preventDefault();
					setFocusPhoto((i) => Math.max(0, i - 1));
					break;
				case "l":
				case "ArrowRight":
					if (s.mode !== "photo" || !item) return;
					e.preventDefault();
					setFocusPhoto((i) =>
						Math.min(Math.max(0, item.photos.length - 1), i + 1)
					);
					break;
				case "x": {
					if (s.mode !== "photo" || !item) return;
					const p = item.photos[s.focusPhoto];
					if (p) {
						e.preventDefault();
						toggleFlag(p.id);
					}
					break;
				}
				case "Enter":
					if (s.mode !== "photo" || !item) return;
					e.preventDefault();
					deleteFlaggedFor(item);
					break;
				case "p": {
					if (s.mode !== "photo" || !item) return;
					const p = item.photos[s.focusPhoto];
					if (p) {
						e.preventDefault();
						setCoverFromPhoto(item, p.id);
					}
					break;
				}
				case "r":
					if (s.mode !== "photo" || !item) return;
					e.preventDefault();
					markReviewed(item);
					break;
			}
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [toggleFlag, deleteFlaggedFor, setCoverFromPhoto, markReviewed]);

	if (!list.length) {
		return (
			<p className="text-ink-400 py-16 text-center">
				Nothing left to triage. 🎉
			</p>
		);
	}

	return (
		<div className="flex flex-col gap-4 pb-24">
			{list.map((item, idx) =>
				mode === "photo" ? (
					<PhotoCard
						key={item.id}
						ref={(el) => {
							cardEls.current[idx] = el;
						}}
						item={item}
						focused={idx === focusCard}
						focusPhoto={idx === focusCard ? focusPhoto : -1}
						flagged={flagged}
						busy={busy === item.id}
						onFocus={() => setFocusCard(idx)}
						onToggleFlag={toggleFlag}
						onDeleteFlagged={() => deleteFlaggedFor(item)}
						onSetCover={(pid) => setCoverFromPhoto(item, pid)}
						onUploadBrand={(slot, file) => uploadBrand(item, slot, file)}
						onClearBrand={(slot) => clearBrand(item, slot)}
						onAddPhotos={(files) => addPhotos(item, files)}
						onMarkReviewed={() => markReviewed(item)}
					/>
				) : (
					<MenuCard
						key={item.id}
						ref={(el) => {
							cardEls.current[idx] = el;
						}}
						item={item}
						focused={idx === focusCard}
						busy={busy === item.id}
						onFocus={() => setFocusCard(idx)}
						onUpload={(files) => uploadMenu(item, files)}
						onDeleteFile={(key) => deleteMenuFile(item, key)}
					/>
				)
			)}

			<div ref={sentinel} />
			{hasMore && (
				<div className="flex justify-center py-4">
					<button
						type="button"
						onClick={loadMore}
						disabled={loadingMore}
						className="rounded-md bg-ink-900 text-white px-4 py-1.5 font-display font-bold hover:bg-ink-800 disabled:opacity-50"
					>
						{loadingMore ? "Loading…" : "Load more"}
					</button>
				</div>
			)}

			{mode === "photo" && <KeyboardHints />}
		</div>
	);
}

function KeyboardHints() {
	return (
		<div className="fixed bottom-0 inset-x-0 z-40 bg-ink-900/90 text-paper-50 text-xs py-2 px-4 flex flex-wrap gap-x-4 gap-y-1 justify-center">
			<span>
				<Kbd>j</Kbd>/<Kbd>k</Kbd> card
			</span>
			<span>
				<Kbd>h</Kbd>/<Kbd>l</Kbd> photo
			</span>
			<span>
				<Kbd>x</Kbd> flag
			</span>
			<span>
				<Kbd>Enter</Kbd> delete flagged
			</span>
			<span>
				<Kbd>p</Kbd> set as cover
			</span>
			<span>
				<Kbd>r</Kbd> reviewed + next
			</span>
		</div>
	);
}

function Kbd({ children }: { children: React.ReactNode }) {
	return (
		<kbd className="rounded bg-paper-50/20 px-1.5 py-0.5 font-mono text-[11px]">
			{children}
		</kbd>
	);
}

function CardHeader({ item }: { item: TriageItem }) {
	const where = [item.suburb, item.state].filter(Boolean).join(", ");
	return (
		<div className="flex items-start justify-between gap-3">
			<div className="min-w-0">
				<h3 className="font-display font-bold text-ink-900 leading-tight truncate">
					{item.name}
					{item.featuredRank != null && (
						<span className="ml-2 align-middle text-[10px] font-display font-bold uppercase bg-marigold-500 text-ink-900 rounded px-1.5 py-0.5">
							Featured
						</span>
					)}
				</h3>
				<p className="text-sm text-ink-500">
					{where || "—"}
					{item.rating != null
						? ` · ★ ${item.rating}${item.reviewCount != null ? ` (${item.reviewCount})` : ""}`
						: ""}
				</p>
			</div>
			<div className="flex shrink-0 items-center gap-2 text-xs">
				<Link
					href={`/admin/${item.slug}`}
					target="_blank"
					className="text-chili-600 hover:underline font-medium"
				>
					Edit
				</Link>
				{item.website && (
					<a
						href={item.website}
						target="_blank"
						rel="noopener noreferrer"
						className="text-ink-500 hover:text-chili-600 inline-flex items-center gap-0.5"
					>
						Site <ArrowSquareOut size={12} />
					</a>
				)}
				{item.googleMapsUrl && (
					<a
						href={item.googleMapsUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="text-ink-500 hover:text-chili-600 inline-flex items-center gap-0.5"
					>
						Maps <ArrowSquareOut size={12} />
					</a>
				)}
			</div>
		</div>
	);
}

// Single-image slot for the standalone cover or logo: shows the current image
// with replace/clear, or a drag/click upload zone when empty. Reuses the
// per-restaurant cover/logo admin routes.
function MediaSlot({
	label,
	imageKey,
	sizeClass,
	aspectClass,
	onUpload,
	onClear,
}: {
	label: string;
	imageKey: string | null;
	sizeClass: string;
	aspectClass: string;
	onUpload: (file: File) => void;
	onClear: () => void;
}) {
	const fileInput = useRef<HTMLInputElement | null>(null);
	const [dragging, setDragging] = useState(false);

	const onDrop = (e: DragEvent) => {
		e.preventDefault();
		setDragging(false);
		const f = Array.from(e.dataTransfer.files).find((x) =>
			x.type.startsWith("image/")
		);
		if (f) onUpload(f);
	};

	return (
		<div className={`${sizeClass} shrink-0`}>
			<div className="mb-1 text-[10px] font-display font-bold uppercase tracking-wide text-ink-400">
				{label}
			</div>
			<div
				onClick={() => !imageKey && fileInput.current?.click()}
				onDragOver={(e) => {
					e.preventDefault();
					setDragging(true);
				}}
				onDragLeave={() => setDragging(false)}
				onDrop={onDrop}
				className={`relative ${aspectClass} grid place-items-center overflow-hidden rounded-md bg-paper-200 ${
					imageKey
						? "border border-ink-100"
						: dragging
							? "border-2 border-chili-400 bg-chili-50"
							: "cursor-pointer border-2 border-dashed border-ink-200 hover:border-chili-300"
				}`}
			>
				{imageKey ? (
					<>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={mediaUrl(imageKey) ?? ""}
							alt=""
							className="h-full w-full object-cover"
						/>
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								fileInput.current?.click();
							}}
							title={`Replace ${label.toLowerCase()}`}
							className="absolute bottom-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-ink-900/60 text-white hover:bg-chili-600"
						>
							<UploadSimple size={13} />
						</button>
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								onClear();
							}}
							title={`Clear ${label.toLowerCase()}`}
							className="absolute top-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-ink-900/60 text-white hover:bg-chili-600"
						>
							<X size={13} weight="bold" />
						</button>
					</>
				) : (
					<span className="flex flex-col items-center gap-1 text-[11px] font-display font-bold text-ink-400">
						<UploadSimple size={18} /> {dragging ? "Drop" : "Add"}
					</span>
				)}
			</div>
			<input
				ref={fileInput}
				type="file"
				accept="image/*"
				hidden
				onChange={(e) => {
					const f = e.target.files?.[0];
					if (f) onUpload(f);
					e.target.value = "";
				}}
			/>
		</div>
	);
}

function PhotoCard({
	ref,
	item,
	focused,
	focusPhoto,
	flagged,
	busy,
	onFocus,
	onToggleFlag,
	onDeleteFlagged,
	onSetCover,
	onUploadBrand,
	onClearBrand,
	onAddPhotos,
	onMarkReviewed,
}: {
	ref: (el: HTMLDivElement | null) => void;
	item: TriageItem;
	focused: boolean;
	focusPhoto: number;
	flagged: Set<number>;
	busy: boolean;
	onFocus: () => void;
	onToggleFlag: (id: number) => void;
	onDeleteFlagged: () => void;
	onSetCover: (id: number) => void;
	onUploadBrand: (slot: "cover" | "logo", file: File) => void;
	onClearBrand: (slot: "cover" | "logo") => void;
	onAddPhotos: (files: FileList | File[]) => void;
	onMarkReviewed: () => void;
}) {
	const fileInput = useRef<HTMLInputElement | null>(null);
	const [dragging, setDragging] = useState(false);
	const flagCount = item.photos.filter((p) => flagged.has(p.id)).length;

	const onDrop = (e: DragEvent) => {
		e.preventDefault();
		setDragging(false);
		if (e.dataTransfer.files.length) onAddPhotos(e.dataTransfer.files);
	};

	return (
		<div
			ref={ref}
			onMouseDown={onFocus}
			className={`bg-white rounded-lg border p-4 transition-shadow ${
				focused ? "border-chili-400 ring-2 ring-chili-200" : "border-ink-100"
			} ${busy ? "opacity-60 pointer-events-none" : ""}`}
		>
			<CardHeader item={item} />

			<div className="mt-3 flex gap-3">
				{/* cover + logo rail: the standalone hero (card + detail) and brand mark */}
				<div className="flex shrink-0 flex-col gap-2">
					<MediaSlot
						label="Cover"
						imageKey={item.coverKey}
						sizeClass="w-40"
						aspectClass="aspect-[4/3]"
						onUpload={(f) => onUploadBrand("cover", f)}
						onClear={() => onClearBrand("cover")}
					/>
					<MediaSlot
						label="Logo"
						imageKey={item.logoKey}
						sizeClass="w-20"
						aspectClass="aspect-square"
						onUpload={(f) => onUploadBrand("logo", f)}
						onClear={() => onClearBrand("logo")}
					/>
				</div>

				{/* photo strip */}
				<div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1">
				{item.photos.map((p, pi) => {
					const isFlagged = flagged.has(p.id);
					const isCursor = focused && pi === focusPhoto;
					const isCover = !!item.coverKey && p.key === item.coverKey;
					return (
						<div
							key={p.id}
							className={`relative shrink-0 w-32 aspect-square rounded-md overflow-hidden bg-paper-200 group ${
								isCursor ? "ring-2 ring-chili-500" : ""
							}`}
						>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={mediaUrl(p.key) ?? ""}
								alt=""
								loading="lazy"
								onClick={() => onToggleFlag(p.id)}
								className={`w-full h-full object-cover cursor-pointer ${
									isFlagged ? "opacity-40" : ""
								}`}
							/>
							{isFlagged && (
								<div className="absolute inset-0 grid place-items-center bg-chili-600/30 pointer-events-none">
									<Trash size={22} weight="fill" className="text-white" />
								</div>
							)}
							<div className="absolute top-1 left-1">{sourceBadge(p.source)}</div>
							<button
								type="button"
								onClick={() => onSetCover(p.id)}
								title={isCover ? "Current cover" : "Set as cover"}
								className={`absolute bottom-1 left-1 h-6 w-6 grid place-items-center rounded-full ${
									isCover
										? "bg-marigold-500 text-ink-900"
										: "bg-ink-900/60 text-white opacity-0 group-hover:opacity-100"
								}`}
							>
								<Star size={13} weight={isCover ? "fill" : "regular"} />
							</button>
							<button
								type="button"
								onClick={() => onToggleFlag(p.id)}
								title="Flag for delete (x)"
								className={`absolute top-1 right-1 h-6 w-6 grid place-items-center rounded-full transition ${
									isFlagged
										? "bg-chili-600 text-white"
										: "bg-ink-900/60 text-white opacity-0 group-hover:opacity-100 hover:bg-chili-600"
								}`}
							>
								<X size={13} weight="bold" />
							</button>
						</div>
					);
				})}

				{/* add zone */}
				<button
					type="button"
					onClick={() => fileInput.current?.click()}
					onDragOver={(e) => {
						e.preventDefault();
						setDragging(true);
					}}
					onDragLeave={() => setDragging(false)}
					onDrop={onDrop}
					className={`shrink-0 w-32 aspect-square rounded-md border-2 border-dashed grid place-items-center text-ink-400 ${
						dragging
							? "border-chili-400 bg-chili-50 text-chili-600"
							: "border-ink-200 hover:border-chili-300"
					}`}
				>
					<span className="flex flex-col items-center gap-1 text-xs font-display font-bold">
						<UploadSimple size={20} /> Add
					</span>
				</button>
				<input
					ref={fileInput}
					type="file"
					accept="image/*"
					multiple
					hidden
					onChange={(e) => {
						if (e.target.files?.length) onAddPhotos(e.target.files);
						e.target.value = "";
					}}
				/>
				</div>
			</div>

			{/* actions */}
			<div className="mt-3 flex flex-wrap items-center gap-2">
				<button
					type="button"
					onClick={onDeleteFlagged}
					disabled={flagCount === 0}
					className="inline-flex items-center gap-1 rounded-md py-1.5 px-3 text-sm font-display font-bold bg-chili-50 text-chili-700 border border-chili-200 hover:bg-chili-100 disabled:opacity-40"
				>
					<Trash size={15} weight="fill" /> Delete flagged
					{flagCount > 0 ? ` (${flagCount})` : ""}
				</button>
				<button
					type="button"
					onClick={onMarkReviewed}
					className="inline-flex items-center gap-1 rounded-md py-1.5 px-3 text-sm font-display font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
				>
					<Check size={15} weight="bold" /> Reviewed
				</button>
				{item.photosReviewedAt && (
					<span className="text-xs text-ink-400">reviewed</span>
				)}
			</div>
		</div>
	);
}

function MenuCard({
	ref,
	item,
	focused,
	busy,
	onFocus,
	onUpload,
	onDeleteFile,
}: {
	ref: (el: HTMLDivElement | null) => void;
	item: TriageItem;
	focused: boolean;
	busy: boolean;
	onFocus: () => void;
	onUpload: (files: FileList | File[]) => void;
	onDeleteFile: (key: string) => void;
}) {
	const fileInput = useRef<HTMLInputElement | null>(null);
	const [dragging, setDragging] = useState(false);
	const hasMenu = !!item.menuUrl || item.menuFiles.length > 0;

	const onDrop = (e: DragEvent) => {
		e.preventDefault();
		setDragging(false);
		if (e.dataTransfer.files.length) onUpload(e.dataTransfer.files);
	};

	return (
		<div
			ref={ref}
			onMouseDown={onFocus}
			className={`bg-white rounded-lg border p-4 transition-shadow ${
				focused ? "border-chili-400 ring-2 ring-chili-200" : "border-ink-100"
			} ${busy ? "opacity-60 pointer-events-none" : ""}`}
		>
			<CardHeader item={item} />

			<div className="mt-3 flex flex-col sm:flex-row gap-3">
				<button
					type="button"
					onClick={() => fileInput.current?.click()}
					onDragOver={(e) => {
						e.preventDefault();
						setDragging(true);
					}}
					onDragLeave={() => setDragging(false)}
					onDrop={onDrop}
					className={`flex-1 min-h-24 rounded-md border-2 border-dashed grid place-items-center text-ink-400 ${
						dragging
							? "border-chili-400 bg-chili-50 text-chili-600"
							: "border-ink-200 hover:border-chili-300"
					}`}
				>
					<span className="flex flex-col items-center gap-1 text-sm font-display font-bold">
						<UploadSimple size={22} /> Drop menu (image or PDF)
					</span>
				</button>
				<input
					ref={fileInput}
					type="file"
					accept="image/*,application/pdf"
					multiple
					hidden
					onChange={(e) => {
						if (e.target.files?.length) onUpload(e.target.files);
						e.target.value = "";
					}}
				/>

				{hasMenu && (
					<div className="sm:w-64 flex flex-col gap-1.5">
						{item.menuFiles.map((key) => {
							const isPdf = /\.pdf$/i.test(key);
							return (
								<div
									key={key}
									className="flex items-center gap-2 rounded-md border border-ink-100 p-1.5"
								>
									<a
										href={mediaUrl(key) ?? "#"}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-2 min-w-0 flex-1 text-sm text-ink-700 hover:text-chili-600"
									>
										{isPdf ? (
											<FilePdf size={18} className="shrink-0" />
										) : (
											// eslint-disable-next-line @next/next/no-img-element
											<img
												src={mediaUrl(key) ?? ""}
												alt=""
												className="h-9 w-9 object-cover rounded shrink-0"
											/>
										)}
										<span className="truncate">{key.split("/").pop()}</span>
									</a>
									<button
										type="button"
										onClick={() => onDeleteFile(key)}
										title="Delete this menu file"
										className="shrink-0 grid place-items-center h-7 w-7 rounded text-chili-600 hover:bg-chili-50"
									>
										<Trash size={15} weight="fill" />
									</button>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
