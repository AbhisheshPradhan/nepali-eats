"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	Storefront,
	SealCheck,
	Tray,
	Palette,
	type Icon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

type Item = { href: string; label: string; icon: Icon };

const ITEMS: Item[] = [
	{ href: "/admin", label: "Restaurants", icon: Storefront },
	{ href: "/admin/claims", label: "Claim Requests", icon: SealCheck },
	{ href: "/admin/submissions", label: "New Submissions", icon: Tray },
	{ href: "/admin/playground", label: "UI Playground", icon: Palette },
];

// "Restaurants" owns /admin plus its sub-tools (editor, triage, review); the
// other three are exact destinations, so anything not claimed by them is
// considered the Restaurants section.
const RESERVED = ITEMS.filter((i) => i.href !== "/admin").map((i) => i.href);

function isActive(href: string, pathname: string): boolean {
	if (href === "/admin") return !RESERVED.some((r) => pathname.startsWith(r));
	return pathname === href || pathname.startsWith(href + "/");
}

export function AdminNav() {
	const pathname = usePathname();

	return (
		<nav className="md:w-[220px] md:shrink-0 md:border-r border-b md:border-b-0 border-paper-200">
			<div className="md:sticky md:top-4 p-3 md:p-4">
				<p className="px-3 mb-3 font-display font-extrabold text-ink-900 text-lg">
					Admin
				</p>
				<ul className="flex md:flex-col gap-1 overflow-x-auto">
					{ITEMS.map(({ href, label, icon: Icon }) => {
						const active = isActive(href, pathname);
						return (
							<li key={href}>
								<Link
									href={href}
									aria-current={active ? "page" : undefined}
									className={cn(
										"flex items-center gap-2.5 rounded-lg px-3 py-2 font-display font-bold whitespace-nowrap transition-colors",
										active
											? "bg-chili-500 text-white"
											: "text-ink-600 hover:bg-paper-100 hover:text-ink-900",
									)}
								>
									<Icon
										size={18}
										weight={active ? "fill" : "regular"}
										className="shrink-0"
									/>
									{label}
								</Link>
							</li>
						);
					})}
				</ul>
			</div>
		</nav>
	);
}
