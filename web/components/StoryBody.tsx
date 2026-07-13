import Image from "next/image";
import type { StoryBlock } from "@/lib/stories";
import { renderInline } from "@/components/inline";
import { PlaceCard } from "@/components/PlaceCard";
import type { Restaurant } from "@/lib/types";

export function StoryBody({
  blocks,
  places,
}: {
  blocks: StoryBlock[];
  places?: Record<string, Restaurant>;
}) {
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
        if (b.type === "image")
          return (
            <figure key={i} className="my-7">
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-paper-200">
                <Image
                  src={b.src}
                  alt={b.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 760px"
                  className="object-cover"
                  loading="lazy"
                />
              </div>
              {(b.caption || b.credit) && (
                <figcaption className="text-ink-500 text-[0.9rem] mt-2 leading-relaxed">
                  {b.caption}
                  {b.caption && b.credit ? " · " : ""}
                  {b.credit}
                </figcaption>
              )}
            </figure>
          );
        if (b.type === "places") {
          const rs = b.slugs
            .map((sl) => places?.[sl])
            .filter((r): r is Restaurant => Boolean(r));
          if (!rs.length) return null;
          return (
            <div key={i} className="my-7">
              {b.title && (
                <h2 className="font-display font-extrabold text-[1.7rem] text-ink-900 mt-9 mb-3">
                  {b.title}
                </h2>
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                {rs.map((r) => (
                  <PlaceCard key={r.id} r={r} surface="story" />
                ))}
              </div>
            </div>
          );
        }
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
