import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
	ForkKnife,
	Camera,
	Clock,
	QrCode,
	SealCheck,
} from "@phosphor-icons/react/dist/ssr";
import { query } from "@/lib/db";
import { ClaimForm } from "@/components/claim/ClaimForm";

// The owner claim pitch page. PUBLIC on purpose: the pitch converts before we
// ask for an account (auth happens on the button, inside ClaimForm). Not for
// search engines, it's a transactional page (noindex), but the tab still
// deserves a real title.
export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const { slug } = await params;
	const rows = await query<{ name: string }>(
		`SELECT name FROM restaurants WHERE slug = $1`,
		[slug],
	);
	const name = rows[0]?.name;
	return {
		// no manual suffix: the layout's title template appends "- NepaliEats"
		title: name ? `Claim ${name}` : "Claim your restaurant",
		robots: { index: false, follow: false },
	};
}

const PERKS = [
	{
		icon: <ForkKnife size={22} weight="fill" />,
		title: "Your menu, kept current",
		body: "Upload your latest menu and we update the dishes and prices people see, so nobody walks in asking for something you stopped serving.",
	},
	{
		icon: <Camera size={22} weight="fill" />,
		title: "Your photos, your call",
		body: "Swap the cover, add the dishes you're proud of, drop the shots that don't do your food justice.",
	},
	{
		icon: <Clock size={22} weight="fill" />,
		title: "Hours and details, fixed in seconds",
		body: "Public holidays, a new phone number, a second seating: change it yourself the moment it changes.",
	},
	{
		icon: <QrCode size={22} weight="fill" />,
		title: "QR menu for your tables",
		body: "Coming soon, free: a scannable menu built from the menu already on your page.",
	},
];

export default async function ClaimPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const rows = await query<{
		id: number;
		name: string;
		suburb: string | null;
		state: string | null;
		email: string | null;
		claimed: boolean;
	}>(
		`SELECT r.id, r.name, r.suburb, r.state, r.email,
		        EXISTS (SELECT 1 FROM restaurant_owners o WHERE o.restaurant_id = r.id) AS claimed
		   FROM restaurants r WHERE r.slug = $1`,
		[slug],
	);
	const r = rows[0];
	if (!r) notFound();

	const where = [r.suburb, r.state].filter(Boolean).join(", ");

	return (
		<div className="max-w-[720px] mx-auto px-4 sm:px-6 py-10">
			<span className="eyebrow text-chili-500">Run this kitchen?</span>
			<h1 className="font-display font-extrabold text-[2rem] leading-tight text-ink-900 mt-1.5">
				Claim {r.name}
			</h1>
			<p className="text-ink-700 mt-2 max-w-[560px]">
				{where ? `${r.name} in ${where} is on NepaliEats.` : `${r.name} is on NepaliEats.`}{" "}
				If it&apos;s your kitchen, take the wheel: claiming is free and takes
				about a minute.
			</p>

			<div className="grid sm:grid-cols-2 gap-4 mt-8">
				{PERKS.map((p) => (
					<div key={p.title} className="bg-white rounded-xl shadow-sm p-5">
						<span className="text-chili-500">{p.icon}</span>
						<h2 className="font-display font-bold text-[1.05rem] text-ink-900 mt-2">
							{p.title}
						</h2>
						<p className="text-ink-700 text-[0.95rem] mt-1 leading-snug">
							{p.body}
						</p>
					</div>
				))}
			</div>

			<div className="mt-8 flex items-start gap-2.5 rounded-xl border border-marigold-300 bg-marigold-100/60 px-4 py-3 text-marigold-700">
				<SealCheck size={20} weight="fill" className="mt-0.5 shrink-0" />
				<p className="font-display font-semibold text-[0.95rem] leading-snug">
					Sign up with the email address your restaurant lists publicly
					and you&apos;re verified on the spot. Otherwise we confirm
					through your restaurant&apos;s socials, usually within a day or
					two. No paperwork, nothing to upload.
				</p>
			</div>

			{r.claimed ? (
				<div className="mt-8 bg-white rounded-xl shadow-sm p-6">
					<h2 className="font-display font-bold text-[1.15rem] text-ink-900">
						Already claimed
					</h2>
					<p className="text-ink-700 mt-1.5">
						{r.name} already has a verified owner on NepaliEats. Think
						that&apos;s wrong? Email{" "}
						<a
							href="mailto:hello@nepalieats.com.au"
							className="font-semibold text-chili-600 hover:underline"
						>
							hello@nepalieats.com.au
						</a>{" "}
						and we&apos;ll sort it out.
					</p>
					<Link
						href={`/restaurant/${slug}`}
						className="inline-block mt-4 font-display font-bold text-chili-600 hover:underline"
					>
						Back to the page
					</Link>
				</div>
			) : (
				<ClaimForm slug={slug} restaurantName={r.name} />
			)}
		</div>
	);
}
