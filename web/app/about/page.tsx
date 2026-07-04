import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Section } from "@/components/legal";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://nepalieats.com.au";
const CONTACT = "hello@nepalieats.com.au";

export const metadata: Metadata = {
  title: "About NepaliEats",
  description:
    "NepaliEats maps every Nepali restaurant, cafe and food truck in Australia. Here is who we are, how we build the directory, and how to get your restaurant listed.",
  alternates: { canonical: "/about" },
};

// Site/service FAQ, distinct from the food FAQ on /nepali-food (no Q&A is shared
// between the two, so their FAQPage schema doesn't collide).
const FAQ: { q: string; a: string }[] = [
  {
    q: "Is NepaliEats free to use?",
    a: "Yes. Browsing restaurants, menus and maps is completely free for diners, with no account needed.",
  },
  {
    q: "How do you decide which restaurants are listed?",
    a: "We aim to list every Nepali restaurant, cafe, takeaway and food truck in Australia. We start from public business listings and each venue's own website, then check them by hand and remove places that have closed.",
  },
  {
    q: "I own a Nepali restaurant. How do I get listed or fix my details?",
    a: `Email us at ${CONTACT} with your restaurant name and what needs adding or changing, and we will sort it out. An owner claim-and-edit tool is on the way.`,
  },
  {
    q: "Is the information always accurate?",
    a: "We work hard to keep it current, but hours, prices and menus change. Always confirm the details that matter with the venue directly before you travel or order.",
  },
  {
    q: "Do restaurants pay to be listed?",
    a: "No. Listings are free and we do not take payment to include or rank a restaurant. If we add paid features later, we will label them clearly.",
  },
];

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "NepaliEats",
        url: SITE,
        logo: `${SITE}/logo-momo.svg`,
        description:
          "A directory of Nepali restaurants, cafes and food trucks across Australia.",
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQ.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <LegalPage
        title="About NepaliEats"
        intro="NepaliEats maps every plate of Nepali food in Australia, from momo houses in western Sydney to food-truck queues in Melbourne. Our goal is simple: help you find your people's food, and help you find your momo people."
      >
        <Section title="What we do">
          <p>
            We gather Nepali restaurants, cafes, takeaways and food trucks from
            across the country into one place you can search and map. Where we
            have them, we add real menus with prices, opening hours, photos and
            the dishes each kitchen is known for, so you can decide where to eat
            before you leave the house.
          </p>
        </Section>

        <Section title="How we build the directory">
          <p>
            We start from public business listings and each venue&apos;s own
            website, then check the details by hand. Menus are transcribed from a
            restaurant&apos;s own menu, never from third-party delivery apps,
            because those often carry marked-up prices and only part of the
            menu. We hide places that have permanently closed so you are not sent
            to a locked door.
          </p>
          <p>
            It is an ongoing job and we do not get everything right. If you spot
            something wrong, please tell us.
          </p>
        </Section>

        <Section title="For restaurant owners">
          <p>
            Want your restaurant added, or need to fix your hours, menu or
            photos? Email{" "}
            <a
              href={`mailto:${CONTACT}`}
              className="text-chili-600 font-semibold underline underline-offset-2"
            >
              {CONTACT}
            </a>{" "}
            and we will help. A tool to claim your listing and edit it yourself
            is on the way.
          </p>
        </Section>

        <Section title="Frequently asked">
          <div className="flex flex-col gap-5">
            {FAQ.map((f) => (
              <div key={f.q}>
                <h3 className="font-display font-bold text-[1.12rem] text-ink-900 mb-1.5">
                  {f.q}
                </h3>
                <p>{f.a}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Get in touch">
          <p>
            Questions, corrections or just want to tell us about a great new
            momo spot? Email{" "}
            <a
              href={`mailto:${CONTACT}`}
              className="text-chili-600 font-semibold underline underline-offset-2"
            >
              {CONTACT}
            </a>
            . See also our{" "}
            <Link
              href="/disclaimer"
              className="text-chili-600 font-semibold underline underline-offset-2"
            >
              disclaimer
            </Link>
            ,{" "}
            <Link
              href="/privacy"
              className="text-chili-600 font-semibold underline underline-offset-2"
            >
              privacy policy
            </Link>{" "}
            and{" "}
            <Link
              href="/terms"
              className="text-chili-600 font-semibold underline underline-offset-2"
            >
              terms of use
            </Link>
            .
          </p>
        </Section>
      </LegalPage>
    </>
  );
}
