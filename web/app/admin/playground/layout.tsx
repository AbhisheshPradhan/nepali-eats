import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

export const metadata = { robots: { index: false, follow: false } };

export default function PlaygroundLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8">
			<div className="flex items-start justify-between gap-4 mb-6">
				<div>
					<h1 className="font-display font-extrabold text-2xl text-ink-900 mb-1">
						UI Playground
					</h1>
					<p className="text-ink-500 text-sm">
						A scratch space for trying out components and design tweaks.
					</p>
				</div>
				<Link
					href="/mockups"
					className="shrink-0 inline-flex items-center gap-1 text-chili-600 hover:text-chili-700 font-display font-bold text-sm"
				>
					Logos
					<ArrowRight
						size={15}
						weight="bold"
					/>
				</Link>
			</div>
			{children}
		</div>
	);
}
