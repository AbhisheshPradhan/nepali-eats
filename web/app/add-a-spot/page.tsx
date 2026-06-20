import type { Metadata } from "next";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { Bunting } from "@/components/Bunting";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Add a spot",
  description:
    "Know a Nepali kitchen, cafe or food truck we have missed? Soon you will be able to add it to the map.",
  alternates: { canonical: "/add-a-spot" },
};

export default function AddASpotPage() {
  return (
    <div className="max-w-[680px] mx-auto px-6 py-16 text-center">
      <Bunting />
      <span className="eyebrow text-chili-500">Coming soon</span>
      <h1 className="text-[2.6rem] text-ink-900 mt-2 mb-4">
        Know a spot we have missed?
      </h1>
      <p className="text-ink-700 text-[1.2rem] leading-relaxed mb-8">
        We are building a simple way for you to add your favourite Nepali kitchen,
        cafe, food truck or weekend stall to the map. For now, keep exploring the
        hundreds of spots already here.
      </p>
      <Button href="/explore" iconLeft={<Plus weight="bold" size={18} />}>
        Explore the map
      </Button>
    </div>
  );
}
