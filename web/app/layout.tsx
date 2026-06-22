import type { Metadata } from "next";
import { Baloo_2, Mukta } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { UserLocationProvider } from "@/lib/useUserLocation";

// NepaliEats brand theme for all Clerk UI (the sign-in/up modal, UserButton).
const clerkAppearance = {
  layout: {
    socialButtonsPlacement: "bottom" as const,
    socialButtonsVariant: "blockButton" as const,
  },
  variables: {
    colorPrimary: "#e5392b",
    colorText: "#2b1a12",
    colorTextSecondary: "#7a6453",
    colorBackground: "#fffbf4",
    colorInputBackground: "#fffbf4",
    borderRadius: "0.75rem",
    fontFamily: "var(--font-mukta), system-ui, sans-serif",
    fontSize: "1rem",
  },
  elements: {
    formButtonPrimary:
      "bg-chili-500 hover:bg-chili-600 text-white normal-case font-display font-bold text-[1rem] py-3 rounded-xl shadow-none",
    formFieldInput:
      "rounded-xl border-2 border-paper-300 bg-paper-50 py-3 text-ink-900",
    formFieldLabel: "font-display font-semibold text-ink-900",
    headerTitle: "font-display font-extrabold text-2xl text-ink-900",
    socialButtonsBlockButton:
      "border-2 border-paper-300 rounded-xl py-3 font-display font-semibold text-ink-900 hover:bg-paper-100",
    socialButtonsBlockButtonText: "font-display font-semibold",
    dividerLine: "bg-paper-300",
    dividerText: "text-ink-500",
    formFieldInputShowPasswordButton: "text-ink-500",
    formResendCodeLink: "text-chili-500",
    identityPreviewEditButton: "text-chili-500",
    footerActionLink: "text-chili-500 font-bold",
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
    default: "NepaliEats - All the Nepali food in Australia",
    template: "%s - NepaliEats",
  },
  description:
    "Find every place to eat Nepali food across Australia: momo, Thakali dal bhat, sel roti, Newari feasts. Restaurants, cafes, food trucks and market stalls, gathered in one happy place.",
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
          </UserLocationProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
