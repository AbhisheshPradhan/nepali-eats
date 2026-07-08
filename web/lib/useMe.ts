"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

export type Me = { isAdmin: boolean; canEdit: boolean; owned: boolean };

const NOBODY: Me = { isAdmin: false, canEdit: false, owned: false };

// ONE /api/me request per page for the header-side consumers (Header's admin
// link + mobile "My restaurants" item, AppUserButton's menu) — previously each
// fetched separately, 3x per page view, each costing identity + ownership DB
// queries. The promise is cached at module level, keyed by the Clerk user id,
// so signing in/out through the modal (no full page reload) refetches instead
// of serving the previous identity. EditModeProvider deliberately does NOT use
// this: its /api/me?restaurantId= call asks a different question (canEdit for
// one specific restaurant).
let cacheKey: string | null = null;
let cached: Promise<Me> | null = null;

function fetchMe(key: string): Promise<Me> {
	if (cacheKey !== key || !cached) {
		cacheKey = key;
		cached = fetch("/api/me")
			.then((r) => (r.ok ? r.json() : NOBODY))
			.then((d) => ({
				isAdmin: !!d.isAdmin,
				canEdit: !!d.canEdit,
				owned: !!d.owned,
			}))
			.catch(() => NOBODY);
	}
	return cached;
}

export function useMe(): Me {
	const { isSignedIn, user } = useUser();
	const [me, setMe] = useState<Me>(NOBODY);
	// signed out -> no request at all; the API would only say NOBODY anyway
	const key = isSignedIn ? (user?.id ?? "signed-in") : null;
	useEffect(() => {
		if (!key) {
			setMe(NOBODY);
			return;
		}
		let active = true;
		fetchMe(key).then((m) => active && setMe(m));
		return () => {
			active = false;
		};
	}, [key]);
	return me;
}
