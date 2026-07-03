import Link from "next/link";
import type { ReactNode } from "react";

const LINK = /\[([^\]]+)\]\(([^)]+)\)/g;

export const inlineLinkClass =
  "text-chili-600 font-semibold underline underline-offset-2 hover:text-chili-700";

// Parses a lightweight inline syntax shared by Stories and Landing copy:
// [label](/href) for internal links, [label](https://...) for external ones.
// Everything else is plain text.
export function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  LINK.lastIndex = 0;
  while ((m = LINK.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const [, label, href] = m;
    nodes.push(
      href.startsWith("/") ? (
        <Link key={key++} href={href} className={inlineLinkClass}>
          {label}
        </Link>
      ) : (
        <a
          key={key++}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={inlineLinkClass}
        >
          {label}
        </a>
      )
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

// Strips inline-link syntax down to its label, for places that need plain text
// (e.g. JSON-LD FAQ answers).
export function stripInline(text: string): string {
  return text.replace(LINK, "$1");
}
