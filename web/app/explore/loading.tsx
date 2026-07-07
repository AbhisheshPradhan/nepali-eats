// Streams the instant a navigation into /explore starts, while the dynamic
// server render (IP-geo, focus/extent queries) resolves. Without this, App
// Router keeps showing the PREVIOUS page (e.g. the homepage after a search
// pick) with zero acknowledgement — the "dead pause" this skeleton kills.
// Same-route filter changes are transitions and keep the live UI; this only
// shows on entry from another page.
export default function ExploreLoading() {
	return (
		<div className="animate-pulse">
			{/* top bar: search pill + Near me circle + filter pill row */}
			<div className="px-4 sm:px-6 py-3 border-b border-paper-300 bg-paper-100">
				<div className="flex items-center gap-3">
					<div className="flex-1 min-w-0 max-w-[560px] h-11 rounded-full bg-white border border-sand-400" />
					<div className="shrink-0 w-11 h-11 rounded-full bg-chili-500/70" />
				</div>
				<div className="mt-3 flex items-center gap-2.5">
					<div className="h-11 w-28 rounded-full bg-white border-2 border-sand-400" />
					<div className="ml-auto h-11 w-11 rounded-full bg-white border-2 border-sand-400" />
					<div className="h-11 w-11 rounded-full bg-white border-2 border-sand-400" />
				</div>
			</div>

			{/* list: heading line + card rows with thumbnail squares */}
			<div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-4">
				<div className="h-6 w-52 rounded-full bg-paper-200 mb-5" />
				<div className="flex flex-col">
					{[0, 1, 2, 3, 4].map((i) => (
						<div
							key={i}
							className="py-3.5 border-b border-paper-300 flex items-start gap-3"
						>
							<div className="min-w-0 flex-1 flex flex-col gap-2.5">
								<div className="h-5 w-3/5 rounded-full bg-paper-200" />
								<div className="h-4 w-2/5 rounded-full bg-paper-200" />
								<div className="h-4 w-1/2 rounded-full bg-paper-200" />
								<div className="h-7 w-40 rounded-full bg-paper-200 mt-1" />
							</div>
							<div className="w-[92px] h-[92px] shrink-0 rounded-lg bg-paper-200" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
