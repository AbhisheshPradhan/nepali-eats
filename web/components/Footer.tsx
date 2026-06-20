import Link from "next/link";
import Image from "next/image";

const FLAGS = [
  "bg-flag-blue",
  "bg-flag-white",
  "bg-flag-red",
  "bg-flag-green",
  "bg-flag-yellow",
];

function Col({
  title,
  items,
}: {
  title: string;
  items: { label: string; href: string }[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="font-display font-bold text-white mb-1">{title}</div>
      {items.map((i) => (
        <Link
          key={i.label}
          href={i.href}
          className="text-paper-200 text-[0.95rem] hover:text-white transition-colors"
        >
          {i.label}
        </Link>
      ))}
    </div>
  );
}

export function Footer() {
  return (
    <footer className="bg-ink-900 text-white mt-16">
      <div className="flex h-2.5" aria-hidden>
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className={`flex-1 ${FLAGS[i % 5]}`} />
        ))}
      </div>
      <div className="max-w-[1180px] mx-auto px-6 pt-12 pb-9 flex gap-12 flex-wrap">
        <div className="max-w-[320px]">
          <div className="flex items-center gap-2.5 mb-3">
            <Image src="/logo-momo.svg" alt="" width={36} height={36} />
            <span className="font-display font-extrabold text-[1.35rem]">
              <span className="text-marigold-500">Nepali</span>
              <span className="text-white">Eats</span>
            </span>
          </div>
          <p className="text-paper-200 leading-relaxed m-0">
            Every plate of Nepali food in Australia, gathered with love, from
            steamy momo windows to Sunday market stalls.
          </p>
        </div>
        <div className="flex gap-12 flex-wrap">
          <Col
            title="Explore"
            items={[
              { label: "By cuisine", href: "/explore" },
              { label: "By city", href: "/explore" },
              { label: "Food trucks", href: "/explore?venue=Food+Truck" },
              { label: "Momo near you", href: "/momo" },
            ]}
          />
          <Col
            title="Community"
            items={[
              { label: "Add a spot", href: "/add-a-spot" },
              { label: "Our story", href: "/stories" },
              { label: "For owners", href: "/add-a-spot" },
            ]}
          />
          <Col
            title="Hungry?"
            items={[
              { label: "Momo guide", href: "/stories" },
              { label: "Where to eat thali", href: "/stories" },
              { label: "Festival eats", href: "/stories" },
            ]}
          />
        </div>
      </div>
      <div className="border-t border-white/10 py-[18px] px-6 text-center text-paper-200 text-[0.85rem]">
        Made with love for Nepali food in Australia · © 2026 NepaliEats
      </div>
    </footer>
  );
}
