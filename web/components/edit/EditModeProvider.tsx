"use client";

import {
	createContext,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from "react";
import { useUser } from "@clerk/nextjs";

// Inline edit mode for the restaurant detail page. Wraps the page body so the
// Edit toggle and every editable field share one source of truth.
//
// `canEdit` is resolved here (admin OR owner, via /api/me?restaurantId) so edit
// mode can only ever be true for someone allowed to edit. Anonymous traffic
// still gets the provider but with canEdit=false, so no control ever renders and
// the detail page stays a plain cached page for visitors.
interface EditModeValue {
	canEdit: boolean;
	editMode: boolean;
	setEditMode: (on: boolean) => void;
	slug: string;
	restaurantId: string;
}

const Ctx = createContext<EditModeValue | null>(null);

export function useEditMode(): EditModeValue {
	const v = useContext(Ctx);
	if (!v) throw new Error("useEditMode must be used within <EditModeProvider>");
	return v;
}

export function EditModeProvider({
	slug,
	restaurantId,
	children,
}: {
	slug: string;
	restaurantId: string;
	children: ReactNode;
}) {
	const { isSignedIn } = useUser();
	const [canEdit, setCanEdit] = useState(false);
	const [editMode, setEditMode] = useState(false);

	useEffect(() => {
		if (!isSignedIn) {
			setCanEdit(false);
			setEditMode(false);
			return;
		}
		let active = true;
		fetch(`/api/me?restaurantId=${restaurantId}`)
			.then((r) => (r.ok ? r.json() : { canEdit: false }))
			.then((d) => {
				if (active) setCanEdit(!!d.canEdit);
			})
			.catch(() => {});
		return () => {
			active = false;
		};
	}, [isSignedIn, restaurantId]);

	return (
		<Ctx.Provider
			value={{
				canEdit,
				// editMode is meaningless without edit rights; clamp it so a stale
				// true can never expose inputs to a signed-out/permission-lost user.
				editMode: editMode && canEdit,
				setEditMode,
				slug,
				restaurantId,
			}}
		>
			{children}
		</Ctx.Provider>
	);
}
