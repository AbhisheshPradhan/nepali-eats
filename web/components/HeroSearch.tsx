"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { NavigationArrow } from "@phosphor-icons/react";
import { SearchBox } from "@/components/SearchBox";
import { storeLoc } from "@/lib/useUserLocation";

export function HeroSearch() {
	const router = useRouter();
	const [locating, setLocating] = useState(false);

	const nearMe = () => {
		if (!navigator.geolocation) {
			router.push("/explore");
			return;
		}
		setLocating(true);
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				const { latitude, longitude } = pos.coords;
				storeLoc(latitude, longitude);
				router.push(
					`/explore?lat=${latitude.toFixed(5)}&lng=${longitude.toFixed(5)}`,
				);
			},
			() => {
				setLocating(false);
				router.push("/explore");
			},
			{ timeout: 8000 },
		);
	};

	return (
		<div className="max-w-[600px] mx-auto mt-5 mb-2">
			<SearchBox variant="hero" />
			<button
				onClick={nearMe}
				disabled={locating}
				className="mt-4 inline-flex items-center gap-2 bg-white border-2 border-sand-400 rounded-full px-[18px] py-2.5 shadow-sm cursor-pointer font-display font-bold text-base text-chili-600 transition-colors hover:bg-chili-100 hover:border-chili-500 disabled:opacity-60"
			>
				<NavigationArrow
					className="text-chili-500"
					weight="fill"
					size={18}
				/>
				<span>
					{locating
						? "Finding spots near you…"
						: "Explore nearby restaurants"}
				</span>
			</button>
		</div>
	);
}
