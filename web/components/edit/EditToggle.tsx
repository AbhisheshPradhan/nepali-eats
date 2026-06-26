"use client";

import { PencilSimpleIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { useEditMode } from "./EditModeProvider";

// The Edit pencil on the cover, repurposed as an edit-mode toggle. Renders
// nothing unless the viewer can edit. In edit mode it becomes a "Done" check so
// the same control turns editing off. Mirrors SaveButton's floating styling so
// the two sit together top-right of the cover.
export function EditToggle({
	className,
}: {
	className?: string;
	variant?: "inline" | "floating";
}) {
	const { canEdit, editMode, setEditMode } = useEditMode();
	if (!canEdit) return null;

	return (
		<button
			type="button"
			onClick={() => setEditMode(!editMode)}
			aria-pressed={editMode}
			className={cn(
				"inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full shadow-md ring-1 ring-black/5 cursor-pointer transition-colors font-semibold text-sm",
				editMode
					? "bg-chili-500 text-white hover:bg-chili-600"
					: "bg-white text-ink-900 hover:bg-paper-100 hover:text-chili-500",
				className,
			)}
		>
			<PencilSimpleIcon
				size={18}
				weight={"bold"}
			/>
			Edit Restaurant
		</button>
	);
}
