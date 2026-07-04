import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Section, Bullets } from "@/components/legal";

const CONTACT = "hello@nepalieats.com.au";

export const metadata: Metadata = {
  title: "Terms of Use - NepaliEats",
  description:
    "The terms for using the NepaliEats website: how the directory works, accuracy of information, acceptable use, intellectual property and liability.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      updated="4 July 2026"
      intro="These terms govern your use of the NepaliEats website. By using the site, you agree to them. If you do not agree, please do not use the site."
    >
      <Section n={1} title="About the service">
        <p>
          NepaliEats is a free, informational directory of Nepali restaurants,
          cafes and food trucks in Australia. We help you discover and research
          places to eat. We are not a booking, ordering or payment service, and
          we are not affiliated with the venues we list.
        </p>
      </Section>

      <Section n={2} title="Accuracy of information">
        <p>
          We work to keep listings, menus, prices and opening hours accurate, but
          we cannot guarantee they are complete, current or error-free. Details
          change often. Always confirm what matters (hours, prices, dietary and
          halal information, availability) directly with the venue before you
          travel or order. See our{" "}
          <Link
            href="/disclaimer"
            className="text-chili-600 font-semibold underline underline-offset-2"
          >
            disclaimer
          </Link>{" "}
          for more.
        </p>
      </Section>

      <Section n={3} title="Acceptable use">
        <p>You agree not to:</p>
        <Bullets
          items={[
            "Use the site for any unlawful purpose.",
            "Scrape, copy or harvest the directory or its data by automated means without our written permission.",
            "Attempt to disrupt, overload or gain unauthorised access to the site or its systems.",
            "Submit false, misleading or infringing content.",
          ]}
        />
      </Section>

      <Section n={4} title="Restaurant listings and submissions">
        <p>
          Listings are compiled from public information and each venue&apos;s own
          website. If you are an owner and want your listing added, corrected or
          removed, contact us at{" "}
          <a
            href={`mailto:${CONTACT}`}
            className="text-chili-600 font-semibold underline underline-offset-2"
          >
            {CONTACT}
          </a>
          . If you submit content to us, you confirm you have the right to share
          it and grant us permission to use it to operate the directory.
        </p>
      </Section>

      <Section n={5} title="Intellectual property">
        <p>
          The site&apos;s design, original writing and the compilation of the
          directory belong to NepaliEats. Restaurant names, logos, menus and
          trade marks belong to their respective owners and are shown for
          identification and information only.
        </p>
      </Section>

      <Section n={6} title="Third-party links">
        <p>
          The site links to venue websites, maps and social pages we do not
          control. We are not responsible for their content, accuracy or
          practices.
        </p>
      </Section>

      <Section n={7} title="No warranty">
        <p>
          The site is provided on an &quot;as is&quot; and &quot;as
          available&quot; basis, without warranties of any kind, to the fullest
          extent permitted by law. Nothing in these terms excludes rights you
          have under the Australian Consumer Law that cannot lawfully be
          excluded.
        </p>
      </Section>

      <Section n={8} title="Limitation of liability">
        <p>
          To the fullest extent permitted by law, NepaliEats is not liable for
          any loss or damage arising from your use of the site or reliance on its
          information, including a visit to a venue whose details had changed.
        </p>
      </Section>

      <Section n={9} title="Changes to these terms">
        <p>
          We may update these terms from time to time. We will change the date at
          the top when we do, and continued use of the site means you accept the
          updated terms.
        </p>
      </Section>

      <Section n={10} title="Governing law">
        <p>
          These terms are governed by the laws of New South Wales, Australia, and
          you submit to the courts of that jurisdiction.
        </p>
      </Section>

      <Section n={11} title="Contact">
        <p>
          Questions about these terms? Email{" "}
          <a
            href={`mailto:${CONTACT}`}
            className="text-chili-600 font-semibold underline underline-offset-2"
          >
            {CONTACT}
          </a>
          .
        </p>
      </Section>
    </LegalPage>
  );
}
