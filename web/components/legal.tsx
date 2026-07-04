import type { ReactNode } from "react";

// Shared building blocks for the informational/legal pages (About, Privacy,
// Terms, Disclaimer). Plain, readable prose in the site's type scale.

export function LegalPage({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated?: string; // human date, e.g. "4 July 2026"
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="max-w-[760px] mx-auto px-4 sm:px-6 pt-8 pb-6">
      <h1 className="text-[clamp(2rem,6vw,2.6rem)] text-ink-900 mb-2">
        {title}
      </h1>
      {updated && (
        <p className="text-ink-500 text-[0.95rem] mb-5">Last updated {updated}</p>
      )}
      {intro && (
        <p className="text-ink-700 text-[1.15rem] leading-relaxed">{intro}</p>
      )}
      {children}
    </div>
  );
}

export function Section({
  n,
  title,
  children,
}: {
  n?: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-9">
      <h2 className="font-display font-bold text-ink-900 text-[1.4rem] mb-3">
        {n != null ? `${n}. ` : ""}
        {title}
      </h2>
      <div className="text-ink-700 text-[1.05rem] leading-relaxed flex flex-col gap-4">
        {children}
      </div>
    </section>
  );
}

export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="flex flex-col gap-2 pl-5 list-disc marker:text-chili-400">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
