"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus, List, X, User, ShieldCheck } from "@phosphor-icons/react";
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
	const { isSignedIn } = useUser();
	const { openSignIn } = useClerk();

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

	const isActive = (href: string) =>
		href === "/" ? pathname === "/" : pathname.startsWith(href);

	return (
		<header className="sticky top-0 z-30 bg-paper-50/90 backdrop-blur-md border-b border-paper-300">
			<div className="w-full flex items-center gap-6 py-2 pl-3 pr-6">
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
							iconLeft={<Plus weight="bold" size={16} />}
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

			{open && (
				<>
					<div
						onClick={() => setOpen(false)}
						className="fixed inset-0 top-[57px] bg-ink-900/35 z-[25] min-[880px]:hidden"
					/>
					<div className="absolute left-0 right-0 top-full bg-paper-50 border-b border-paper-300 shadow-lg px-4 pt-3 pb-[18px] flex flex-col gap-1.5 z-[26] min-[880px]:hidden">
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
									iconLeft={<Plus weight="bold" size={16} />}
								>
									Add a spot
								</Button>
							</div>
						)}
						{isAdmin && (
							<Link
								href="/admin"
								onClick={() => setOpen(false)}
								className="mt-1.5 inline-flex w-full items-center justify-center gap-1.5 rounded-full border-2 border-chili-500 text-chili-500 font-display font-bold px-4 py-3.5 hover:bg-chili-100"
							>
								<ShieldCheck size={18} />
								Admin
							</Link>
						)}
						<div className="mt-1.5">
							{isSignedIn ? (
								<div className="px-1 py-2">
									<AppUserButton />
								</div>
							) : (
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
							)}
						</div>
					</div>
				</>
			)}
		</header>
	);
}
