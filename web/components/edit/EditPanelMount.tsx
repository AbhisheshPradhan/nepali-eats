"use client";

import { useEditMode } from "./EditModeProvider";
import { RestaurantEditPanel } from "./RestaurantEditPanel";
import type { RestaurantDetail } from "@/lib/types";

// Connects the edit-mode toggle to the Edit Details drawer. Only mounts the
// panel for admins/owners (canEdit); editMode now means "panel open".
export function EditPanelMount({
	restaurant,
}: {
	restaurant: RestaurantDetail;
}) {
	const { canEdit, editMode, setEditMode } = useEditMode();
	if (!canEdit) return null;
	return (
		<RestaurantEditPanel
			restaurant={restaurant}
			open={editMode}
			onClose={() => setEditMode(false)}
		/>
	);
}
