"use client";

import { useState, type ReactNode } from "react";
import { Popover, Dialog } from "radix-ui";
import { CaretDown, CaretLeft, Check, X } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { Z } from "@/lib/z";

// Shared dropdown primitives for the Explore filter bar (desktop). A labelled
// pill trigger opens a portalled Popover panel of selectable rows. Single-select
// menus close on pick; multi-select callers drive their own open state and let
// the panel stay open while toggling. Ported from the approved filter-bar
// mockup (components/admin/mockups/filter-bar/DropdownBar).

// The trigger pill, in the bar's chip styling. `eyebrow` stacks a small label
// over the value (Category / Dish type / Protein); the plain form is a single
// line (Features / Sort). `active` = a non-default value is selected.
export function FilterTrigger({
	eyebrow,
	value,
	icon,
	active,
	open,
	count,
}: {
	eyebrow?: string;
	value: ReactNode;
	icon?: ReactNode;
	active?: boolean;
	open: boolean;
	count?: number;
}) {
	return (
		<Popover.Trigger asChild>
			<button
				type="button"
				className={cn(
					"shrink-0 inline-flex items-center gap-2 border-2 rounded-full cursor-pointer font-display transition-colors",
					eyebrow ? "px-3.5 py-1.5" : "px-4 py-[7px]",
					active || open
						? "bg-white border-chili-400 text-ink-900"
						: "bg-white border-sand-400 text-ink-700 hover:bg-paper-100",
				)}
			>
				{icon}
				{eyebrow ? (
					<span className="flex flex-col items-start leading-tight text-left">
						<span className="eyebrow text-ink-400 text-[9px]">{eyebrow}</span>
						<span className="font-bold text-[0.92rem] max-w-[11rem] truncate">
							{value}
						</span>
					</span>
				) : (
					<span className="font-bold text-[0.9rem]">{value}</span>
				)}
				{count ? (
					<span className="inline-grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-chili-500 text-white text-[0.72rem] leading-none">
						{count}
					</span>
				) : null}
				<CaretDown
					size={14}
					weight="bold"
					className={cn(
						"text-ink-400 transition-transform shrink-0",
						open && "rotate-180",
					)}
				/>
			</button>
		</Popover.Trigger>
	);
}

// The floating panel. Portalled (escapes the top bar's overflow) and above the
// map + overlays via Z.popover.
export function FilterPanel({
	align = "start",
	children,
}: {
	align?: "start" | "end";
	children: ReactNode;
}) {
	return (
		<Popover.Portal>
			<Popover.Content
				align={align}
				sideOffset={8}
				style={{ zIndex: Z.popover }}
				className="min-w-[200px] rounded-2xl border border-paper-300 bg-white p-1.5 shadow-xl shadow-ink-900/10"
			>
				{children}
			</Popover.Content>
		</Popover.Portal>
	);
}

// One selectable row: check indicator + optional icon + label.
export function MenuRow({
	selected,
	icon,
	label,
	onSelect,
}: {
	selected: boolean;
	icon?: ReactNode;
	label: ReactNode;
	onSelect: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onSelect}
			className={cn(
				"w-full flex items-center gap-3 rounded-xl px-2.5 py-2 cursor-pointer text-left font-display transition-colors",
				selected ? "text-chili-600" : "text-ink-800 hover:bg-paper-100",
			)}
		>
			<span
				className={cn(
					"grid place-items-center w-[22px] h-[22px] rounded-md border-2 shrink-0 transition-colors",
					selected
						? "bg-chili-500 border-chili-500 text-white"
						: "border-sand-400 text-transparent",
				)}
			>
				<Check size={13} weight="bold" />
			</span>
			{icon && (
				<span className={selected ? "text-chili-500" : "text-ink-400"}>
					{icon}
				</span>
			)}
			<span className="font-bold text-[0.95rem]">{label}</span>
		</button>
	);
}

// A single-select menu that closes on pick. Controlled so a row can close it.
export function SingleSelectMenu({
	eyebrow,
	value,
	icon,
	active,
	align,
	children,
}: {
	eyebrow?: string;
	value: ReactNode;
	icon?: ReactNode;
	active?: boolean;
	align?: "start" | "end";
	children: (close: () => void) => ReactNode;
}) {
	const [open, setOpen] = useState(false);
	return (
		<Popover.Root open={open} onOpenChange={setOpen}>
			<FilterTrigger
				eyebrow={eyebrow}
				value={value}
				icon={icon}
				active={active}
				open={open}
			/>
			<FilterPanel align={align}>{children(() => setOpen(false))}</FilterPanel>
		</Popover.Root>
	);
}

// --- mobile bottom sheet -----------------------------------------------------

// A bottom sheet (mobile) built on Radix Dialog so overlay + content sit above
// the map and top bar (Z.popover) and get built-in enter/exit slide animation.
// Grab handle, header (optional back + title/subtitle + close), scrollable body,
// sticky footer.
export function FilterSheet({
	open,
	onOpenChange,
	title,
	subtitle,
	onBack,
	footer,
	children,
}: {
	open: boolean;
	onOpenChange: (v: boolean) => void;
	title: string;
	subtitle?: string;
	onBack?: () => void;
	footer: ReactNode;
	children: ReactNode;
}) {
	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Portal>
				<Dialog.Overlay
					style={{ zIndex: Z.popover }}
					className="fixed inset-0 bg-ink-900/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 duration-300"
				/>
				<Dialog.Content
					aria-describedby={undefined}
					style={{ zIndex: Z.popover }}
					className="fixed inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-2xl bg-paper-50 shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom duration-300"
				>
					<div className="mx-auto mt-2.5 h-1 w-9 rounded-full bg-sand-400 shrink-0" />
					<div className="flex items-center gap-2 px-4 pt-2 pb-3 border-b border-paper-300 shrink-0">
						{onBack && (
							<button
								type="button"
								onClick={onBack}
								aria-label="Back"
								className="grid place-items-center w-8 h-8 rounded-full text-ink-700 hover:bg-paper-200 cursor-pointer -ml-1"
							>
								<CaretLeft size={18} weight="bold" />
							</button>
						)}
						<div className="min-w-0">
							<Dialog.Title className="font-display font-bold text-[1.15rem] text-ink-900 inline">
								{title}
							</Dialog.Title>
							{subtitle && (
								<span className="font-display font-bold text-[1.15rem] text-ink-400">
									{" · "}
									{subtitle}
								</span>
							)}
						</div>
						<Dialog.Close asChild>
							<button
								type="button"
								aria-label="Close"
								className="ml-auto grid place-items-center w-9 h-9 rounded-full bg-paper-200 text-ink-700 hover:bg-sand-400 cursor-pointer shrink-0"
							>
								<X size={16} weight="bold" />
							</button>
						</Dialog.Close>
					</div>
					<div className="overflow-y-auto px-4 py-3">{children}</div>
					<div className="mt-auto flex items-center gap-3 border-t border-paper-300 px-4 py-3 shrink-0">
						{footer}
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}

// A pill chip inside a sheet (marigold when active — the warm dish-refine look).
export function SheetChip({
	active,
	label,
	onClick,
}: {
	active: boolean;
	label: string;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			aria-pressed={active}
			onClick={onClick}
			className={cn(
				"border-2 rounded-full px-4 py-2 cursor-pointer font-display font-bold text-[0.92rem] transition-colors",
				active
					? "bg-marigold-500 border-marigold-500 text-ink-900"
					: "bg-white border-sand-400 text-ink-800 hover:bg-paper-100",
			)}
		>
			{label}
		</button>
	);
}

// A labelled group of chips inside a sheet.
export function SheetSection({
	label,
	icon,
	children,
}: {
	label: string;
	icon?: ReactNode;
	children: ReactNode;
}) {
	return (
		<div className="mb-5 last:mb-1">
			<div className="eyebrow text-ink-500 text-[11px] mb-2.5 flex items-center gap-1.5">
				{icon}
				{label}
			</div>
			<div className="flex flex-wrap gap-2.5">{children}</div>
		</div>
	);
}

// The primary "Show N places" footer button.
export function SheetShowButton({
	n,
	onClick,
}: {
	n: number;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="flex-1 rounded-full bg-chili-500 text-white px-5 py-3 font-display font-bold text-[1rem] cursor-pointer hover:bg-chili-600 transition-colors"
		>
			Show {n} {n === 1 ? "place" : "places"}
		</button>
	);
}

// A muted text button for a sheet footer (Reset / Clear).
export function SheetTextButton({
	children,
	disabled,
	onClick,
}: {
	children: ReactNode;
	disabled?: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			className="shrink-0 font-display font-bold text-[0.95rem] text-ink-500 px-2 cursor-pointer hover:text-ink-900 disabled:opacity-40 transition-colors"
		>
			{children}
		</button>
	);
}
