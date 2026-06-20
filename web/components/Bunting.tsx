const FLAGS = ["#2d6fd8", "#f5a623", "#e5392b", "#4a9d5b"];

export function Bunting({ count = 9 }: { count?: number }) {
  return (
    <div className="flex gap-2 justify-center mb-[18px]" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="w-0 h-0 border-l-[14px] border-r-[14px] border-l-transparent border-r-transparent"
          style={{
            borderTop: `24px solid ${FLAGS[i % FLAGS.length]}`,
            filter: "drop-shadow(0 3px 3px rgba(43,26,18,.18))",
          }}
        />
      ))}
    </div>
  );
}
