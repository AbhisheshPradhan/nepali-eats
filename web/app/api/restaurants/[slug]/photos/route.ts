import { NextResponse } from "next/server";
import { restaurantGallery } from "@/lib/queries";

// Gallery photo keys for one restaurant, used by the Explore map popup carousel.
// Near-static data; cache at the edge so repeat popups don't re-hit the DB.
export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ slug: string }> },
) {
	const { slug } = await params;
	const gallery = await restaurantGallery(slug);
	return NextResponse.json(
		gallery,
		{
			headers: {
				"Cache-Control":
					"public, s-maxage=3600, stale-while-revalidate=86400",
			},
		},
	);
}
