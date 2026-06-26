import type { Metadata } from "next";
import { Baloo_2, Mukta } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { UserLocationProvider } from "@/lib/useUserLocation";
import { Toaster } from "@/components/shadcn/sonner";

// NepaliEats brand theme for all Clerk UI (the sign-in/up modal, UserButton).
const clerkAppearance = {
	layout: {
		socialButtonsPlacement: "top" as const,
		socialButtonsVariant: "blockButton" as const,
		logoPlacement: "none" as const,
	},
	variables: {
		colorPrimary: "#e5392b",
		colorText: "#2b1a12",
		colorTextSecondary: "#7a6453",
		colorBackground: "#fffbf4",
		colorInputBackground: "#fffbf4",
		colorInputText: "#2b1a12",
		colorDanger: "#d72631",
		colorSuccess: "#4a9d5b",
		borderRadius: "0.875rem",
		fontFamily: "var(--font-mukta), system-ui, sans-serif",
		fontFamilyButtons: "var(--font-baloo), system-ui, sans-serif",
		fontSize: "1rem",
	},
	elements: {
		// Card: warm cream surface, brand-tinted shadow, soft paper border.
		card: "bg-paper-50 rounded-[22px] shadow-[0_16px_40px_rgba(43,26,18,0.14)] border border-paper-200",
		headerTitle: "font-display font-extrabold text-2xl text-ink-900",
		headerSubtitle: "text-ink-500",
		formButtonPrimary:
			"bg-chili-500 hover:bg-chili-600 active:bg-chili-700 text-white normal-case font-display font-bold text-[1rem] py-3 rounded-xl shadow-[0_10px_28px_rgba(229,57,43,0.22)] transition-colors",
		formFieldInput:
			"rounded-xl border-2 border-paper-300 bg-paper-50 py-3 text-ink-900 focus:border-chili-300",
		formFieldLabel: "font-display font-semibold text-ink-900",
		socialButtonsBlockButton:
			"border-2 border-paper-300 rounded-xl py-3 font-display font-semibold text-ink-900 hover:bg-paper-100 transition-colors",
		socialButtonsBlockButtonText: "font-display font-semibold",
		dividerLine: "bg-paper-300",
		dividerText: "text-ink-500 font-display",
		formFieldInputShowPasswordButton: "text-ink-500 hover:text-ink-900",
		formResendCodeLink: "text-chili-500 hover:text-chili-600 font-semibold",
		identityPreviewEditButton: "text-chili-500 hover:text-chili-600",
		footerActionText: "text-ink-500",
		footerActionLink: "text-chili-500 hover:text-chili-600 font-bold",
		modalCloseButton:
			"text-ink-500 hover:text-ink-900 hover:bg-paper-100 rounded-full",
	},
};

const baloo = Baloo_2({
	variable: "--font-baloo",
	subsets: ["latin", "devanagari"],
	weight: ["400", "500", "600", "700", "800"],
	display: "swap",
});

const mukta = Mukta({
	variable: "--font-mukta",
	subsets: ["latin", "devanagari"],
	weight: ["300", "400", "500", "600", "700"],
	display: "swap",
});

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://nepalieats.com.au";

export const metadata: Metadata = {
	metadataBase: new URL(SITE),
	title: {
		default: "NepaliEats - 500+ Nepali restaurants across Australia",
		template: "%s - NepaliEats",
	},
	description:
		"500+ Nepali restaurants, cafes, food trucks and caterers across Australia, in one place. Find momo, Thakali dal bhat, sel roti and Newari feasts near you.",
	alternates: { canonical: "/" },
	openGraph: { type: "website", siteName: "NepaliEats", locale: "en_AU" },
};

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html
			lang="en-AU"
			className={`${baloo.variable} ${mukta.variable} h-full antialiased`}
		>
			<body className="min-h-full flex flex-col bg-paper-50 text-ink-900">
				<ClerkProvider appearance={clerkAppearance}>
					<UserLocationProvider>
						<Header />
						<main className="flex-1">{children}</main>
						<SiteFooter />
						<Toaster theme="light" position="bottom-right" />
					</UserLocationProvider>
				</ClerkProvider>
			</body>
		</html>
	);
}
