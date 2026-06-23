import { Bunting } from "@/components/Bunting";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
	return (
		<div className="max-w-[680px] mx-auto px-4 sm:px-6 py-20 text-center">
			<Bunting />
			<h1 className="text-[2.6rem] text-ink-900 mt-2 mb-3">
				This plate is empty.
			</h1>
			<p className="text-ink-700 text-[1.15rem] mb-8">
				We could not find that page. Let us point you back to the good
				stuff.
			</p>
			<div className="flex gap-3 justify-center flex-wrap">
				<Button href="/">Back home</Button>
				<Button
					href="/explore"
					variant="outline"
				>
					Explore the map
				</Button>
			</div>
		</div>
	);
}
