"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";

// Reveals server-rendered children on tap. The children are in the HTML from
// the start (hidden), so crawlers still see every card and link; only the
// visitor's first view is kept short.
export function ShowMore({ label, children }: { label: string; children: ReactNode }) {
	const [open, setOpen] = useState(false);
	return (
		<>
			<div hidden={!open}>{children}</div>
			{!open && (
				<div className="mt-6 flex justify-center">
					<Button variant="outline" onClick={() => setOpen(true)}>
						{label}
					</Button>
				</div>
			)}
		</>
	);
}
