// Single source of truth for cuisine/dish imagery + the Nepali-food hub content.
// The image registry drives the hub cards, the landing-page heroes, and (later)
// the generated OG cards, so a nicer photo added here upgrades all three at once.

export interface FoodImage {
  src: string;
  alt: string;
  credit?: string;
}

// Optional per slug: a missing entry falls back to the warm gradient. To add a
// nicer image later, drop it in /public/food/<slug>.jpg and add (or repoint) a
// line here. Today we reuse the four existing tiles under /public/cravings.
export const FOOD_IMAGES: Record<string, FoodImage> = {
  momo: { src: "/cravings/momo.jpg", alt: "Steamed momo in a spiced jhol soup" },
  newari: { src: "/cravings/newari.jpg", alt: "A Newari samay baji spread" },
  tibetan: { src: "/cravings/tibetan.jpg", alt: "Tibetan laphing noodles" },
  vegetarian: {
    src: "/cravings/vegetarian.jpg",
    alt: "A vegetarian Nepali plate",
  },
  // thakali, nepali-indian and individual dishes: add /public/food/<slug>.jpg here.
};

export function foodImage(slug: string): FoodImage | undefined {
  return FOOD_IMAGES[slug];
}

// Extra photos per slug for the on-page gallery (hero is `foodImage`). Empty for
// now: drop images in /public/food/<slug>-1.jpg etc. and list them here. The
// gallery UI hides itself when a slug has none.
export const FOOD_GALLERIES: Record<string, FoodImage[]> = {};

export function foodGallery(slug: string): FoodImage[] {
  return FOOD_GALLERIES[slug] ?? [];
}

export interface FoodLink {
  slug: string;
  name: string;
  href: string;
  blurb: string;
}

// The regional styles that have their own landing page today. `SIGNATURE_DISHES`
// grows as the programmatic dish pages ship (see SEO-PROGRAMMATIC-PLAN.md).
export const CUISINES: FoodLink[] = [
  {
    slug: "newari",
    name: "Newari",
    href: "/nepali-food/newari",
    blurb:
      "Smoky choila, lentil bara and samay baji: the sour, spiced table of the Kathmandu Valley, made for sharing.",
  },
  {
    slug: "thakali",
    name: "Thakali",
    href: "/nepali-food/thakali",
    blurb:
      "The dal bhat set done properly: a richer black dal, gundruk, pickles and bottomless refills.",
  },
  {
    slug: "tibetan",
    name: "Tibetan",
    href: "/nepali-food/tibetan",
    blurb:
      "Himalayan warmers: thukpa noodle soup, cold chilli laphing, and of course momo.",
  },
  {
    slug: "nepali-indian",
    name: "Nepali-Indian",
    href: "/nepali-food/nepali-indian",
    blurb:
      "Curries, tandoor and biryani sharing a menu with momo and dal bhat, for when the table can't agree.",
  },
];

export const DIETARY: FoodLink[] = [
  {
    slug: "vegetarian",
    name: "Vegetarian",
    href: "/nepali-food/vegetarian",
    blurb:
      "Veg momo, dal bhat, gundruk and paneer: meat-free Nepali cooking that never feels like an afterthought.",
  },
];

export const SIGNATURE_DISH: FoodLink = {
  slug: "momo",
  name: "Momo",
  href: "/momo",
  blurb:
    "Nepal's famous dumplings: steamed, fried, jhol or C-momo, always with a fiery achaar. Start here.",
};

// Hub FAQ. Kept distinct from the /momo FAQ so no Q&A is duplicated across two
// pages' FAQPage schema. Inline [label](/href) links supported in answers.
export const NEPALI_FOOD_FAQ: { q: string; a: string }[] = [
  {
    q: "What is Nepali food known for?",
    a: "Momo dumplings first, but there is a lot more: dal bhat, smoky Newari choila, grilled sekuwa, fermented gundruk, and sweet sel roti. It leans on rice, lentils, greens and pickles, with heat you add yourself from the achaar.",
  },
  {
    q: "Is Nepali food spicy?",
    a: "It can be, but most of the heat lives in the achaar and pickles on the side, so you control it. Ask the kitchen for it mild if you want.",
  },
  {
    q: "What is the difference between Nepali and Indian food?",
    a: "They share spices and some dishes, but Nepali food is lighter and less oily, built around dal bhat and momo rather than heavy gravies. Many kitchens here do both, which we tag as [Nepali-Indian](/nepali-food/nepali-indian).",
  },
  {
    q: "Is Nepali food good for vegetarians?",
    a: "Very. Veg momo, dal bhat, gundruk and paneer dishes are on nearly every menu. See the [vegetarian spots](/nepali-food/vegetarian).",
  },
  {
    q: "What should I order on my first visit?",
    a: "A plate of steamed momo to start, a Thakali dal bhat set for the full spread, and sel roti or sikarni to finish.",
  },
];
