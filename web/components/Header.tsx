"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
	Plus,
	List,
	X,
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
		<header className="sticky top-0 z-30 bg-paper-50/90 backdrop-blur-md border-b border-paper-300">
			<div className="w-full flex items-center gap-6 py-2 px-4">
				<Link
					href="/"
					className="flex items-center gap-2.5 cursor-pointer"
				>
					<Image
						src="/logo-momo.svg"
						alt=""
						width={40}
						height={40}
						priority
					/>
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
						"min-[880px]:hidden inline-flex items-center justify-center w-11 h-11 rounded-md border-2 border-ink-900 cursor-pointer shrink-0 text-[1.4rem]",
						open
							? "bg-ink-900 text-white"
							: "bg-transparent text-ink-900",
					)}
				>
					{open ? <X /> : <List />}
				</button>
			</div>
		</header>

		{/* Mobile slide-out panel (kept mounted so it animates both ways).
		    Rendered OUTSIDE <header> on purpose: the header's backdrop-blur
		    (backdrop-filter) makes it the containing block for position:fixed
		    descendants, which would clip this panel to the header's height. */}
			<div
				className="min-[880px]:hidden"
				aria-hidden={!open}
			>
				{/* Backdrop */}
				<div
					onClick={() => setOpen(false)}
					className={cn(
						"fixed inset-0 z-[3000] bg-ink-900/40 backdrop-blur-[2px] transition-opacity duration-300",
						open
							? "opacity-100"
							: "opacity-0 pointer-events-none",
					)}
				/>

				{/* Panel */}
				<div
					role="dialog"
					aria-modal="true"
					aria-label="Menu"
					className={cn(
						"fixed top-0 right-0 bottom-0 z-[3010] flex w-[86%] max-w-sm flex-col bg-paper-50 shadow-2xl",
						"transition-transform duration-300 ease-out will-change-transform",
						open ? "translate-x-0" : "translate-x-full",
					)}
				>
					{/* Panel header */}
					<div className="flex items-center justify-between border-b border-paper-300 px-4 py-3">
						<Link
							href="/"
							onClick={() => setOpen(false)}
							className="flex items-center gap-2.5"
						>
							<Image
								src="/logo-momo.svg"
								alt=""
								width={36}
								height={36}
							/>
							<span className="font-display font-extrabold text-xl tracking-[-0.02em]">
								<span className="text-chili-500">
									Nepali
								</span>
								<span className="text-ink-900">Eats</span>
							</span>
						</Link>
						<button
							onClick={() => setOpen(false)}
							aria-label="Close menu"
							className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-ink-900 text-[1.4rem] text-white"
						>
							<X />
						</button>
					</div>

					{/* Scrollable contents */}
					<div className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-4 pt-3 pb-6">
						{NAV.map((n) => (
							<Link
								key={n.href}
								href={n.href}
								onClick={() => setOpen(false)}
								className={cn(
									"font-display font-bold text-[1.15rem] px-4 py-3.5 rounded-md",
									isActive(n.href)
										? "text-chili-500 bg-paper-100"
										: "text-ink-900",
								)}
							>
								{n.label}
							</Link>
						))}
						{SHOW_POST_LAUNCH && (
							<div className="mt-1.5">
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
						{isAdmin && (
							<Link
								href="/admin"
								onClick={() => setOpen(false)}
								className="mt-1.5 inline-flex w-full items-center justify-start gap-1.5 rounded-md text-chili-500 font-display font-bold px-4 py-3.5 hover:bg-chili-100"
							>
								<ShieldCheck size={18} />
								Admin
							</Link>
						)}
						<div className="mt-1.5">
							{isSignedIn ? (
								<div className="border-t border-paper-300 pt-2.5 mt-1 flex flex-col gap-0.5">
									<div className="flex items-center gap-3 px-4 py-2">
										{user?.imageUrl ? (
											// eslint-disable-next-line @next/next/no-img-element
											<img
												src={user.imageUrl}
												alt=""
												className="w-10 h-10 rounded-full object-cover shrink-0"
											/>
										) : (
											<span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-paper-200 text-ink-700 shrink-0">
												<User size={20} />
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
										className="flex items-center gap-3 px-4 py-3 rounded-md text-ink-900 font-display font-semibold text-[1.05rem] hover:bg-paper-100 text-left"
									>
										<Gear size={20} />
										Manage account
									</button>
									<Link
										href="/saved"
										onClick={() => setOpen(false)}
										className="flex items-center gap-3 px-4 py-3 rounded-md text-ink-900 font-display font-semibold text-[1.05rem] hover:bg-paper-100"
									>
										<Heart size={20} />
										Saved restaurants
									</Link>
									<button
										onClick={() => {
											setOpen(false);
											signOut();
										}}
										className="flex items-center gap-3 px-4 py-3 rounded-md text-ink-900 font-display font-semibold text-[1.05rem] hover:bg-paper-100 text-left"
									>
										<SignOut size={20} />
										Sign out
									</button>
								</div>
							) : (
								<div className="mt-auto border-t border-paper-300 pt-3">
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
			</div>
		</>
	);
}
