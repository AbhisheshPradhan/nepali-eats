export const metadata = { robots: { index: false, follow: false } };

export default function PlaygroundLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8">
			<h1 className="font-display font-extrabold text-2xl text-ink-900 mb-1">
				UI Playground
			</h1>
			<p className="text-ink-500 text-sm mb-6">
				A scratch space for trying out components and design tweaks.
			</p>
			{children}
		</div>
	);
}
