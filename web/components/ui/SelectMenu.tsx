"use client";

import { useState, type ReactNode } from "react";
import { Popover } from "radix-ui";
import { CaretDown, Check } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { Z } from "@/lib/z";

// THE site dropdown, promoted from the Explore filter bar (2026-07-08): white
// rounded-2xl panel, rows with the chili check-circle indicator. Any
// single-select on a public or owner-facing surface uses these; the shadcn
// Select is admin-tooling only. Explore's FilterControls re-exports the
// primitives from here so the filter bar and forms can never drift apart.

// Roving arrow-key focus across the menu rows (a bare Popover of buttons has
// no listbox keyboard support of its own).
export function menuKeyNav(e: React.KeyboardEvent<HTMLElement>) {
	if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
	const items = Array.from(
		e.currentTarget.querySelectorAll<HTMLElement>('[role^="menuitem"]'),
	);
	if (!items.length) return;
	e.preventDefault();
	const i = items.indexOf(document.activeElement as HTMLElement);
	const next =
		e.key === "Home" || (i === -1 && e.key === "ArrowDown")
			? 0
			: e.key === "End" || (i === -1 && e.key === "ArrowUp")
				? items.length - 1
				: e.key === "ArrowDown"
					? (i + 1) % items.length
					: (i - 1 + items.length) % items.length;
	items[next]?.focus();
}

// The floating panel. Portalled and above map/overlays via Z.popover.
// `matchTrigger` sizes it to the trigger (form selects); filter bars let it
// hug its content instead.
export function MenuPanel({
	align = "start",
	matchTrigger = false,
	children,
}: {
	align?: "start" | "end";
	matchTrigger?: boolean;
	children: ReactNode;
}) {
	return (
		<Popover.Portal>
			<Popover.Content
				align={align}
				sideOffset={8}
				role="menu"
				aria-orientation="vertical"
				onKeyDown={menuKeyNav}
				style={{
					zIndex: Z.popover,
					...(matchTrigger
						? { width: "var(--radix-popover-trigger-width)" }
						: {}),
				}}
				className="min-w-[200px] rounded-2xl border border-paper-300 bg-white p-1.5 shadow-xl shadow-ink-900/10"
			>
				{children}
			</Popover.Content>
		</Popover.Portal>
	);
}

// One selectable row: check indicator + optional icon + label. Announced to AT
// as a radio-style menu item (or checkbox-style when `multi`) with the
// selection carried by aria-checked.
export function MenuRow({
	selected,
	icon,
	label,
	multi = false,
	onSelect,
}: {
	selected: boolean;
	icon?: ReactNode;
	label: ReactNode;
	// multi-select row (toggles without closing) -> menuitemcheckbox
	multi?: boolean;
	onSelect: () => void;
}) {
	return (
		<button
			type="button"
			role={multi ? "menuitemcheckbox" : "menuitemradio"}
			aria-checked={selected}
			onClick={onSelect}
			className={cn(
				"w-full flex items-center gap-3 rounded-xl px-2.5 py-2 cursor-pointer text-left font-display transition-colors active:bg-paper-200",
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

// High-level form select: an input-shaped trigger + the house panel/rows.
// Closes on pick. Style the trigger via className to match sibling inputs.
export function SelectMenu<T extends string>({
	value,
	options,
	onChange,
	className,
	ariaLabel,
}: {
	value: T;
	options: { value: T; label: string; icon?: ReactNode }[];
	onChange: (v: T) => void;
	className?: string;
	ariaLabel?: string;
}) {
	const [open, setOpen] = useState(false);
	const current = options.find((o) => o.value === value);
	return (
		<Popover.Root open={open} onOpenChange={setOpen}>
			<Popover.Trigger asChild>
				<button
					type="button"
					aria-label={ariaLabel}
					className={cn(
						"flex items-center justify-between gap-2 cursor-pointer text-left",
						className,
					)}
				>
					<span className="truncate">{current?.label}</span>
					<CaretDown
						size={14}
						weight="bold"
						className={cn(
							"text-ink-400 shrink-0 transition-transform",
							open && "rotate-180",
						)}
					/>
				</button>
			</Popover.Trigger>
			<MenuPanel matchTrigger>
				{options.map((o) => (
					<MenuRow
						key={o.value}
						selected={o.value === value}
						icon={o.icon}
						label={o.label}
						onSelect={() => {
							onChange(o.value);
							setOpen(false);
						}}
					/>
				))}
			</MenuPanel>
		</Popover.Root>
	);
}
