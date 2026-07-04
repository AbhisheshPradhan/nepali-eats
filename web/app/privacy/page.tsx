import type { Metadata } from "next";
import { LegalPage, Section, Bullets } from "@/components/legal";

const CONTACT = "hello@nepalieats.com.au";

export const metadata: Metadata = {
  title: "Privacy Policy - NepaliEats",
  description:
    "How NepaliEats collects, uses and protects your information, the analytics and cookies we use, the providers we rely on, and your privacy rights.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="4 July 2026"
      intro="This policy explains what information NepaliEats collects when you use our website, how we use it, and the choices you have. By using the site you agree to this policy."
    >
      <Section n={1} title="Who we are">
        <p>
          NepaliEats is a directory of Nepali restaurants, cafes and food trucks
          across Australia. If you have any questions about this policy or your
          information, contact us at{" "}
          <a
            href={`mailto:${CONTACT}`}
            className="text-chili-600 font-semibold underline underline-offset-2"
          >
            {CONTACT}
          </a>
          .
        </p>
      </Section>

      <Section n={2} title="Information we collect">
        <p>We keep data collection to a minimum. We may collect:</p>
        <Bullets
          items={[
            "Information you send us. If you email us or submit a restaurant, we receive what you choose to share, such as your name, email and message.",
            "Usage and device data. Like most websites, we automatically receive your device type, browser, referring page and an approximate location based on your IP address, used to show you the right state and to understand how the site is used.",
            "Your location, only with permission. The \"near me\" feature asks your browser for your location. It is used in your browser to sort nearby spots and is not stored by us. You can decline it.",
            "Account information. If you sign in (for example as a restaurant owner or an administrator), our authentication provider handles your login and gives us a user identifier.",
            "Saved restaurants. If you sign in and save spots, we store those saved items against your account.",
          ]}
        />
      </Section>

      <Section n={3} title="How we use your information">
        <Bullets
          items={[
            "To run and improve the website and its features.",
            "To show relevant local results and remember your saved spots.",
            "To respond to your emails and restaurant submissions.",
            "To measure traffic and understand which pages are useful.",
            "To keep the site secure and prevent abuse.",
          ]}
        />
      </Section>

      <Section n={4} title="Cookies and analytics">
        <p>
          We use a small number of cookies to make the site work (for example to
          remember a preference) and analytics to measure how the site is used.
          Analytics data is aggregated and used to improve the site. You can
          block or delete cookies in your browser settings, though some features
          may not work as well.
        </p>
      </Section>

      <Section n={5} title="Service providers we rely on">
        <p>
          We use trusted third parties to run the site. They process data only
          to provide their service to us:
        </p>
        <Bullets
          items={[
            "Hosting and delivery of the website and images.",
            "A database provider that stores the directory and any saved spots.",
            "An analytics provider to measure site usage.",
            "A maps provider to display the interactive map.",
            "An authentication provider for sign-in.",
          ]}
        />
        <p>
          Restaurant details in our directory are compiled in part from public
          business listings and each venue&apos;s own website.
        </p>
      </Section>

      <Section n={6} title="How we share information">
        <p>
          We do not sell your personal information. We share it only with the
          service providers above, or where we are required to by law.
        </p>
      </Section>

      <Section n={7} title="Data retention">
        <p>
          We keep personal information only as long as we need it for the
          purposes above, then delete or anonymise it. Emails you send are kept
          while we handle your request and for a reasonable period afterwards.
        </p>
      </Section>

      <Section n={8} title="Your rights">
        <p>
          You can ask us to access, correct or delete the personal information we
          hold about you. To do so, email{" "}
          <a
            href={`mailto:${CONTACT}`}
            className="text-chili-600 font-semibold underline underline-offset-2"
          >
            {CONTACT}
          </a>
          . We handle personal information in line with the Australian Privacy
          Principles under the Privacy Act 1988 (Cth).
        </p>
      </Section>

      <Section n={9} title="Children">
        <p>
          The site is not directed at children under 13, and we do not knowingly
          collect their personal information.
        </p>
      </Section>

      <Section n={10} title="Links to other sites">
        <p>
          We link to restaurant websites, maps and social pages we do not
          control. Their privacy practices are their own, so please review their
          policies.
        </p>
      </Section>

      <Section n={11} title="Changes to this policy">
        <p>
          We may update this policy from time to time. We will change the date at
          the top when we do, and significant changes will be made clear on the
          site.
        </p>
      </Section>
    </LegalPage>
  );
}
