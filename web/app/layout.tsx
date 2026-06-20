import type { Metadata } from "next";
import { Baloo_2, Mukta } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

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
    default: "NepaliEats — All the Nepali food in Australia, worth the trip",
    template: "%s · NepaliEats",
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
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
