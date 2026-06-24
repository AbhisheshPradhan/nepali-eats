"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
	Plus,
	User,
	ShieldCheck,
	Gear,
	Heart,
	SignOut,
} from "@phosphor-icons/react";
import { useUser, useClerk } from "@clerk/nextjs";
import { AppUserButton } from "@/components/AppUserButton";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const NAV = [
	{ href: "/explore", label: "Explore" },
	{ href: "/stories", label: "Stories" },
];

// Post-launch features — flip to true to re-enable "Add a spot".
const SHOW_POST_LAUNCH = false;

export function Header() {
	const pathname = usePathname();
	const [open, setOpen] = useState(false);
	const { isSignedIn, user } = useUser();
	const { openSignIn, openUserProfile, signOut } = useClerk();

	// Show the Admin link only to admins. Checked client-side (via /api/me) so
	// content pages stay statically cacheable; the real gate is in proxy.ts.
	const [isAdmin, setIsAdmin] = useState(false);
	useEffect(() => {
		if (!isSignedIn) {
			setIsAdmin(false);
			return;
		}
		let active = true;
		fetch("/api/me")
			.then((r) => r.json())
			.then((d) => active && setIsAdmin(!!d.isAdmin))
			.catch(() => {});
		return () => {
			active = false;
		};
	}, [isSignedIn]);

	// Lock body scroll + close on Escape while the slide-out panel is open.
	useEffect(() => {
		if (!open) return;
		const { overflow } = document.body.style;
		document.body.style.overflow = "hidden";
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setOpen(false);
		};
		window.addEventListener("keydown", onKey);
		return () => {
			document.body.style.overflow = overflow;
			window.removeEventListener("keydown", onKey);
		};
	}, [open]);

	const isActive = (href: string) =>
		href === "/" ? pathname === "/" : pathname.startsWith(href);

	return (
		<>
			<header
				className={cn(
					"sticky top-0 transition-colors duration-300",
					open
						? "z-[3020] bg-transparent"
						: "z-30 bg-paper-50/90 backdrop-blur-md border-b border-paper-300",
				)}
			>
				<div className="w-full flex items-center gap-6 py-2 px-4">
					<Link href="/" className="flex items-center cursor-pointer">
						<span className="font-display font-extrabold text-2xl tracking-[-0.02em]">
							<span className="text-chili-500">Nepali</span>
							<span className="text-ink-900">Eats</span>
						</span>
					</Link>

					<nav className="hidden min-[880px]:flex items-center gap-[18px] ml-2">
						{NAV.map((n) => (
							<Link
								key={n.href}
								href={n.href}
								className={cn(
									"font-display font-semibold text-[1.02rem] px-1 py-1.5 border-b-[3px] transition-colors",
									isActive(n.href)
										? "text-chili-500 border-chili-500"
										: "text-ink-700 border-transparent hover:text-chili-500",
								)}
							>
								{n.label}
							</Link>
						))}
						{SHOW_POST_LAUNCH && (
							<Button
								href="/add-a-spot"
								size="sm"
								iconLeft={
									<Plus
										weight="bold"
										size={16}
									/>
								}
								className="ml-3"
							>
								Add a spot
							</Button>
						)}
					</nav>

					<div className="flex-1" />

					<div className="hidden min-[880px]:flex items-center gap-3">
						{isAdmin && (
							<Button
								href="/admin"
								size="sm"
								variant="outline"
								iconLeft={<ShieldCheck size={16} />}
							>
								Admin
							</Button>
						)}
						{isSignedIn ? (
							<AppUserButton />
						) : (
							<Button
								size="sm"
								variant="outline"
								iconLeft={<User size={16} />}
								onClick={() => openSignIn()}
							>
								Log in
							</Button>
						)}
					</div>

					<button
						onClick={() => setOpen((o) => !o)}
						aria-label="Menu"
						aria-expanded={open}
						className={cn(
							"min-[880px]:hidden group inline-flex items-center justify-center w-11 h-11 rounded-2xl cursor-pointer shrink-0",
							"transition-all duration-200 active:scale-90",
							"bg-paper-100 text-ink-900 hover:bg-paper-200",
						)}
					>
						<span className="relative flex h-4 w-5 flex-col justify-between">
							<span
								className={cn(
									"h-0.5 w-full rounded-full bg-current transition-all duration-300",
									open && "translate-y-1.75 rotate-45",
								)}
							/>
							<span
								className={cn(
									"h-0.5 w-full rounded-full bg-current transition-all duration-200",
									open && "opacity-0",
								)}
							/>
							<span
								className={cn(
									"h-0.5 w-full rounded-full bg-current transition-all duration-300",
									open && "-translate-y-1.75 -rotate-45",
								)}
							/>
						</span>
					</button>
				</div>
			</header>

			{/* Mobile full-screen overlay menu. Rendered OUTSIDE <header> so the
		    header's backdrop-filter can't clip it. When open, the header floats
		    above this overlay (z-[3020]) so the hamburger morphs to X in place
		    and acts as the single open/close toggle. */}
			<div
				role="dialog"
				aria-modal="true"
				aria-label="Menu"
				aria-hidden={!open}
				className={cn(
					"min-[880px]:hidden fixed inset-0 z-[3000] flex flex-col bg-paper-50",
					"transition-all duration-300 ease-out",
					open
						? "opacity-100 translate-y-0"
						: "opacity-0 -translate-y-3 pointer-events-none",
				)}
			>
				<div className="flex flex-1 flex-col overflow-y-auto px-6 pt-24 pb-10">
					{/* Big primary nav */}
					<nav className="flex flex-col">
						{NAV.map((n, i) => (
							<Link
								key={n.href}
								href={n.href}
								onClick={() => setOpen(false)}
								style={{
									transitionDelay: open
										? `${i * 50 + 120}ms`
										: "0ms",
								}}
								className={cn(
									"font-display font-extrabold tracking-[-0.02em] text-[2.6rem] leading-tight py-1.5 transition-all duration-300",
									open
										? "opacity-100 translate-y-0"
										: "opacity-0 translate-y-3",
									isActive(n.href)
										? "text-chili-500"
										: "text-ink-900",
								)}
							>
								{n.label}
							</Link>
						))}
					</nav>

					{SHOW_POST_LAUNCH && (
						<div className="mt-8 max-w-xs">
							<Button
								href="/add-a-spot"
								block
								iconLeft={
									<Plus
										weight="bold"
										size={16}
									/>
								}
							>
								Add a spot
							</Button>
						</div>
					)}

					{/* Account section, pinned to the bottom */}
					<div className="mt-auto pt-10">
						{isAdmin && (
							<Link
								href="/admin"
								onClick={() => setOpen(false)}
								className="mb-3 inline-flex w-full items-center gap-2 rounded-xl text-chili-500 font-display font-bold text-[1.1rem] px-4 py-3.5 bg-chili-100/60 hover:bg-chili-100"
							>
								<ShieldCheck size={20} />
								Admin
							</Link>
						)}
						{isSignedIn ? (
							<div className="border-t border-paper-300 pt-4 flex flex-col gap-0.5">
								<div className="flex items-center gap-3 px-4 py-2">
									{user?.imageUrl ? (
										// eslint-disable-next-line @next/next/no-img-element
										<img
											src={user.imageUrl}
											alt=""
											className="w-11 h-11 rounded-full object-cover shrink-0"
										/>
									) : (
										<span className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-paper-200 text-ink-700 shrink-0">
											<User size={22} />
										</span>
									)}
									<div className="min-w-0">
										<div className="font-display font-bold text-ink-900 truncate">
											{user?.fullName ?? "Account"}
										</div>
										{user?.primaryEmailAddress && (
											<div className="text-sm text-ink-500 truncate">
												{
													user.primaryEmailAddress
														.emailAddress
												}
											</div>
										)}
									</div>
								</div>
								<button
									onClick={() => {
										setOpen(false);
										openUserProfile();
									}}
									className="flex items-center gap-3 px-4 py-3 rounded-xl text-ink-900 font-display font-semibold text-[1.05rem] hover:bg-paper-100 text-left"
								>
									<Gear size={20} />
									Manage account
								</button>
								<Link
									href="/saved"
									onClick={() => setOpen(false)}
									className="flex items-center gap-3 px-4 py-3 rounded-xl text-ink-900 font-display font-semibold text-[1.05rem] hover:bg-paper-100"
								>
									<Heart size={20} />
									Saved restaurants
								</Link>
								<button
									onClick={() => {
										setOpen(false);
										signOut();
									}}
									className="flex items-center gap-3 px-4 py-3 rounded-xl text-ink-900 font-display font-semibold text-[1.05rem] hover:bg-paper-100 text-left"
								>
									<SignOut size={20} />
									Sign out
								</button>
							</div>
						) : (
							<div className="border-t border-paper-300 pt-4">
								<Button
									block
									variant="outline"
									iconLeft={<User size={16} />}
									onClick={() => {
										setOpen(false);
										openSignIn();
									}}
								>
									Log in
								</Button>
							</div>
						)}
					</div>
				</div>
			</div>
		</>
	);
}
