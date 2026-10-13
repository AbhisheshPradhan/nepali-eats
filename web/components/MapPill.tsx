"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MapTrifold } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

// Mobile-only floating "See the map" pill for landing pages. Render it right
// AFTER the hero map button: it observes that button (its previous sibling)
// and only shows once the button has scrolled ABOVE the viewport, so the two
// are never on screen together. Observing the real button, not a 0px marker:
// iOS Safari does not reliably report zero-area targets.
export function MapPill({ href, label }: { href: string; label: string }) {
	const sentinel = useRef<HTMLSpanElement>(null);
	const [show, setShow] = useState(false);

	useEffect(() => {
		const el = sentinel.current?.previousElementSibling ?? sentinel.current;
		if (!el) return;
		const io = new IntersectionObserver(([e]) => {
			setShow(!e.isIntersecting && e.boundingClientRect.top < 0);
		});
		io.observe(el);
		return () => io.disconnect();
	}, []);

	return (
		<>
			<span ref={sentinel} aria-hidden className="block h-0" />
			<Link
				href={href}
				aria-hidden={!show}
				tabIndex={show ? undefined : -1}
				className={cn(
					"sm:hidden fixed left-1/2 z-30 bottom-[max(1rem,env(safe-area-inset-bottom))]",
					"inline-flex items-center gap-2 rounded-full bg-chili-500 px-5 py-3 text-white shadow-pop",
					"font-display font-bold text-[1rem] leading-none",
					"transition duration-200 active:bg-chili-600 active:scale-[0.97]",
					show
						? "-translate-x-1/2 translate-y-0 opacity-100"
						: "-translate-x-1/2 translate-y-4 opacity-0 pointer-events-none",
				)}
			>
				<MapTrifold size={18} weight="fill" />
				{label}
			</Link>
		</>
	);
}
