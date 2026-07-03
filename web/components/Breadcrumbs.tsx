import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";

export interface Crumb {
  label: string;
  href: string;
}

// Visual breadcrumb trail. The matching BreadcrumbList JSON-LD is emitted by the
// page (LandingPage), so crawlers get the structured trail and users get the UI.
export function Breadcrumbs({ trail }: { trail: Crumb[] }) {
  if (trail.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" className="mb-3">
      <ol className="flex flex-wrap items-center gap-1.5 text-[0.9rem] text-ink-500">
        {trail.map((c, i) => {
          const last = i === trail.length - 1;
          return (
            <li key={c.href} className="flex items-center gap-1.5 min-w-0">
              {last ? (
                <span className="text-ink-700 font-semibold truncate">
                  {c.label}
                </span>
              ) : (
                <Link
                  href={c.href}
                  className="hover:text-chili-600 transition-colors whitespace-nowrap"
                >
                  {c.label}
                </Link>
              )}
              {!last && (
                <CaretRight size={13} weight="bold" className="text-ink-300 shrink-0" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
