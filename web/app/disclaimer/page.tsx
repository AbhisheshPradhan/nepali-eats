import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Disclaimer - NepaliEats",
	description:
		"NepaliEats website and directory disclaimer: how we list third-party restaurants, the limits of our information, and your responsibility to verify details directly with each venue.",
	alternates: { canonical: "/disclaimer" },
};

function Section({
	n,
	title,
	children,
}: {
	n: number;
	title: string;
	children: React.ReactNode;
}) {
	return (
		<section className="mt-9">
			<h2 className="font-display font-bold text-ink-900 text-[1.4rem] mb-3">
				{n}. {title}
			</h2>
			<div className="text-ink-700 text-[1.05rem] leading-relaxed flex flex-col gap-4">
				{children}
			</div>
		</section>
	);
}

function Bullets({ items }: { items: React.ReactNode[] }) {
	return (
		<ul className="flex flex-col gap-2 pl-5 list-disc marker:text-chili-400">
			{items.map((item, i) => (
				<li key={i}>{item}</li>
			))}
		</ul>
	);
}

export default function DisclaimerPage() {
	return (
		<div className="max-w-[760px] mx-auto px-4 sm:px-6 py-16">
			<span className="eyebrow text-chili-500">The fine print</span>
			<h1 className="text-[2.6rem] text-ink-900 mt-2 mb-2">
				Website &amp; Directory Disclaimer
			</h1>
			<p className="text-ink-500 text-[0.95rem] font-semibold mb-2">
				Effective date: 25 June 2026
			</p>

			<Section
				n={1}
				title="Introduction"
			>
				<p>
					The information provided by NepaliEats (&quot;we,&quot;
					&quot;us,&quot; or &quot;our&quot;) on our website (the
					&quot;Site&quot;) is for general
					informational and directory purposes only. All information on
					the Site regarding Nepali restaurants in Australia is
					provided in good faith. However, we make no representation or
					warranty of any kind, express or implied, regarding the
					accuracy, adequacy, validity, reliability, availability,
					safety, or completeness of any restaurant listing, menu item,
					or information on the Site.
				</p>
			</Section>

			<Section
				n={2}
				title="Third-Party Restaurant Listings & Services"
			>
				<p>
					NepaliEats is an independent directory listing platform
					containing over 550 third-party food and beverage
					establishments.
				</p>
				<Bullets
					items={[
						"We do not own, manage, operate, or control any of the listed restaurants.",
						"We do not endorse, guarantee, or vouch for the quality, hygiene standards, safety, or authenticity of the food, services, or premises of any listed establishment.",
						"Any transaction, booking, order, or dispute you have with a restaurant listed on NepaliEats is strictly between you and that business.",
					]}
				/>
				<p>
					To the maximum extent permitted by law, including the
					Competition and Consumer Act 2010 (Cth), NepaliEats shall
					not be held liable for any loss, injury, illness, damage, or
					negative dining experience resulting from your interaction
					with any restaurant found through our Site.
				</p>
			</Section>

			<Section
				n={3}
				title="Dietary, Allergen, and Halal Disclaimer"
			>
				<p>
					Restaurant menus, ingredient sourcing, and preparation
					styles change frequently.
				</p>
				<Bullets
					items={[
						<>
							<strong>Allergens:</strong> NepaliEats does not
							guarantee that allergen-free information (such as
							gluten-free, nut-free, or dairy-free claims) provided
							by listed restaurants is accurate. Cross-contamination
							may occur at the restaurant premises.
						</>,
						<>
							<strong>Dietary preferences:</strong> Information
							regarding vegetarian, vegan, or Halal options is
							sourced directly from third parties or user
							contributions.
						</>,
					]}
				/>
				<p>
					If you have severe food allergies or strict
					religious/dietary restrictions, you must verify ingredient
					safety and preparation directly with the restaurant
					management before ordering or consuming food.
				</p>
			</Section>

			<Section
				n={4}
				title="Accuracy of Restaurant Information"
			>
				<p>
					While we try to maintain an up-to-date database of over 550
					venues, details such as street addresses, phone numbers,
					trading hours, dine-in availability, and menu prices
					fluctuate. NepaliEats does not guarantee that listing details
					are always completely accurate. Users should confirm vital
					details directly with the restaurant before travelling or
					placing an order.
				</p>
			</Section>

			<Section
				n={5}
				title="User Reviews and Community Content"
			>
				<p>
					The Site may feature reviews, ratings, photos, and commentary
					uploaded by our user community.
				</p>
				<Bullets
					items={[
						"These reviews represent the subjective opinions and experiences of individual users, not the views of NepaliEats.",
						"We do not verify the truth or accuracy of user-submitted reviews.",
						"We reserve the right, but hold no legal obligation, to monitor, edit, or remove content that violates our community guidelines.",
					]}
				/>
			</Section>

			<Section
				n={6}
				title="External Links"
			>
				<p>
					The Site may provide links to third-party restaurant
					websites, social media pages, and menu files. These links are
					provided for your convenience only. NepaliEats does not
					operate these external destinations and is not responsible
					for their functionality, content, accuracy, privacy
					policies, or terms. Visiting them is at your own risk.
				</p>
			</Section>

			<Section
				n={7}
				title="Contact Us"
			>
				<p>
					If you are a restaurant owner wishing to update or remove
					your listing, or if you are a user with questions about this
					disclaimer, please contact us at{" "}
					<a
						href="mailto:support@nepalieats.com.au"
						className="text-chili-500 font-semibold hover:underline"
					>
						support@nepalieats.com.au
					</a>
					.
				</p>
			</Section>
		</div>
	);
}
