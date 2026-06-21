import Link from "next/link";
import type { ReactNode } from "react";
import type { StoryBlock } from "@/lib/stories";

const LINK = /\[([^\]]+)\]\(([^)]+)\)/g;
const linkClass =
  "text-chili-600 font-semibold underline underline-offset-2 hover:text-chili-700";

// Parses a lightweight inline syntax: [label](/href) for internal links and
// [label](https://...) for external ones. Everything else is plain text.
function renderInline(text: string): ReactNode[] {
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
        <Link key={key++} href={href} className={linkClass}>
          {label}
        </Link>
      ) : (
        <a
          key={key++}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
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

export function StoryBody({ blocks }: { blocks: StoryBlock[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        if (b.type === "h2")
          return (
            <h2
              key={i}
              className="font-display font-extrabold text-[1.7rem] text-ink-900 mt-9 mb-3"
            >
              {b.text}
            </h2>
          );
        if (b.type === "p")
          return (
            <p
              key={i}
              className="text-[1.15rem] leading-loose text-ink-700 mb-4.5"
            >
              {renderInline(b.text)}
            </p>
          );
        if (b.type === "list")
          return (
            <ul
              key={i}
              className="list-disc pl-6 mb-5 flex flex-col gap-2 text-[1.15rem] leading-relaxed text-ink-700"
            >
              {b.items.map((it, j) => (
                <li key={j}>{renderInline(it)}</li>
              ))}
            </ul>
          );
        if (b.type === "faq")
          return (
            <div key={i} className="mt-10">
              <h2 className="font-display font-extrabold text-[1.7rem] text-ink-900 mb-4">
                Frequently asked
              </h2>
              <div className="flex flex-col gap-5">
                {b.items.map((f, j) => (
                  <div key={j}>
                    <h3 className="font-display font-bold text-[1.15rem] text-ink-900 mb-1.5">
                      {f.q}
                    </h3>
                    <p className="text-[1.1rem] leading-relaxed text-ink-700">
                      {renderInline(f.a)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        return null;
      })}
    </>
  );
}
