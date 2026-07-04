// Single source of truth for cuisine/dish imagery + the Nepali-food hub content.
// The image registry drives the hub cards, the landing-page heroes, and (later)
// the generated OG cards, so a nicer photo added here upgrades all three at once.

import fs from "node:fs";
import path from "node:path";

export interface FoodImage {
  src: string;
  alt: string;
  credit?: string;
}

// Curated entries win (they carry hand-written alt text). Everything else is
// convention-based: drop web/public/food/<slug>.jpg (or .webp/.png) and the
// hero appears on the next render, no code change. Add an alt line to FOOD_ALT
// when you add a photo; the slug label is the fallback.
export const FOOD_IMAGES: Record<string, FoodImage> = {
  momo: { src: "/cravings/momo.jpg", alt: "Steamed momo in a spiced jhol soup" },
  newari: { src: "/cravings/newari.jpg", alt: "A Newari samay baji spread" },
  tibetan: { src: "/cravings/tibetan.jpg", alt: "Tibetan laphing noodles" },
  vegetarian: {
    src: "/cravings/vegetarian.jpg",
    alt: "A vegetarian Nepali plate",
  },
};

// Alt text for convention-loaded photos, written ahead of the photos landing.
const FOOD_ALT: Record<string, string> = {
  "steamed-momo": "A plate of fresh steamed momo with tomato achaar",
  "jhol-momo": "Jhol momo sitting in a spiced sesame soup",
  "chilli-momo": "C-momo glazed in sticky chilli sauce",
  "fried-momo": "Golden fried momo, crisp at the edges",
  "kothey-momo": "Kothey momo served crisp side up",
  "sandheko-momo": "Sandheko momo tossed with onion, chilli and coriander",
  choila: "A plate of smoky buff choila with beaten rice",
  sekuwa: "Sekuwa skewers charring over the grill",
  "dal-bhat": "A dal bhat set: rice, black dal, greens and pickles",
  thukpa: "A steaming bowl of thukpa noodle soup",
  thakali: "A full Thakali dal bhat set",
  "nepali-indian": "Curries and naan alongside a plate of momo",
};

const FOOD_EXTS = ["jpg", "jpeg", "webp", "png"];

export function foodImage(slug: string): FoodImage | undefined {
  if (FOOD_IMAGES[slug]) return FOOD_IMAGES[slug];
  for (const ext of FOOD_EXTS) {
    const rel = `/food/${slug}.${ext}`;
    if (fs.existsSync(path.join(process.cwd(), "public", rel))) {
      return { src: rel, alt: FOOD_ALT[slug] ?? slug.replace(/-/g, " ") };
    }
  }
  return undefined;
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

// A dish family on the hub page: a short blogger-voice intro, an optional
// "see all" link to its landing page, and the linked dishes underneath.
// Grouping mirrors the taxonomy (momo family, Newari, Thakali, Tibetan, grill)
// so the hub reads as a guide, not a card dump.
export interface FoodFamily {
  slug: string; // image lookup key
  heading: string;
  blurb: string[];
  href?: string;
  linkLabel?: string;
  dishes: FoodLink[];
}

export const FAMILIES: FoodFamily[] = [
  {
    slug: "momo",
    heading: "Momo, obviously",
    blurb: [
      "Nepal's dumplings and the reason half of us are on this site. A thin wrapper, a juicy filling, and a tomato achaar that does the heavy lifting. Every Nepali kitchen in the country makes them and no two plates taste the same, which is exactly why you keep ordering. Six ways to eat them, all worth your time.",
    ],
    href: "/momo",
    linkLabel: "Find the best momo",
    dishes: [
      {
        slug: "steamed-momo",
        name: "Steamed momo",
        href: "/nepali-food/steamed-momo",
        blurb: "The honest test of a momo house: silky skins, juicy filling, achaar on the side.",
      },
      {
        slug: "jhol-momo",
        name: "Jhol momo",
        href: "/nepali-food/jhol-momo",
        blurb: "Momo swimming in a warm sesame and tomato soup. The one people fall hardest for.",
      },
      {
        slug: "chilli-momo",
        name: "C-momo",
        href: "/nepali-food/chilli-momo",
        blurb: "Fried momo tossed in a sticky chilli glaze. Momo for a night out.",
      },
      {
        slug: "fried-momo",
        name: "Fried momo",
        href: "/nepali-food/fried-momo",
        blurb: "Golden, crunchy edges, same juicy middle. Order when you want texture.",
      },
      {
        slug: "kothey-momo",
        name: "Kothey momo",
        href: "/nepali-food/kothey-momo",
        blurb: "Pan-fried: crisp base, steamed top. The potsticker of the Himalaya.",
      },
      {
        slug: "sandheko-momo",
        name: "Sandheko momo",
        href: "/nepali-food/sandheko-momo",
        blurb: "Momo tossed in a sharp, tangy dressing of chilli, timur and mustard oil.",
      },
    ],
  },
  {
    slug: "newari",
    heading: "The Newari table",
    blurb: [
      "The Kathmandu Valley has its own cuisine, and it is the one we push on everyone. Smoky, sour, generous with the mustard oil, and made to share over a long sitting. Bara and samay baji are waiting on the menus; choila is the way in.",
    ],
    href: "/nepali-food/newari",
    linkLabel: "See the Newari kitchens",
    dishes: [
      {
        slug: "choila",
        name: "Choila",
        href: "/nepali-food/choila",
        blurb: "Smoky grilled meat with mustard oil and timur. Order it with beaten rice.",
      },
    ],
  },
  {
    slug: "thakali",
    heading: "The Thakali set",
    blurb: [
      "If momo is the snack, the Thakali set is the meal. A darker black dal, gundruk, a row of pickles, and rice refills until you wave the kitchen away. The best value plate in Nepali food, and it is not close.",
    ],
    href: "/nepali-food/thakali",
    linkLabel: "Find a Thakali set near you",
    dishes: [
      {
        slug: "dal-bhat",
        name: "Dal bhat",
        href: "/nepali-food/dal-bhat",
        blurb: "The meal Nepal runs on: dal, rice, curry and pickles, refilled until you tap out.",
      },
    ],
  },
  {
    slug: "tibetan",
    heading: "The Tibetan side",
    blurb: [
      "Nepal shares a border and half a menu with Tibet, and the overlap is where the warmers live. Thukpa for cold nights, laphing when you want cold noodles that bite back, and momo, always momo.",
    ],
    href: "/nepali-food/tibetan",
    linkLabel: "See the Tibetan kitchens",
    dishes: [
      {
        slug: "thukpa",
        name: "Thukpa",
        href: "/nepali-food/thukpa",
        blurb: "A big Himalayan noodle soup, built for cold nights.",
      },
    ],
  },
  {
    slug: "grill",
    heading: "From the grill",
    blurb: [
      "Nepali barbecue: meat marinated hard, charred over flame, eaten with beaten rice and something cold. Sekuwa is the headline act; sukuti and taas join the list as we eat our way through more menus.",
    ],
    dishes: [
      {
        slug: "sekuwa",
        name: "Sekuwa",
        href: "/nepali-food/sekuwa",
        blurb: "Lamb, chicken or pork on skewers. Order it wherever you see a proper grill.",
      },
    ],
  },
];

// The two audience filters that aren't cuisines with dish children; rendered
// as simple cards after the family sections.
export const EXTRAS: FoodLink[] = [
  {
    slug: "nepali-indian",
    name: "Nepali-Indian",
    href: "/nepali-food/nepali-indian",
    blurb:
      "Curries, tandoor and biryani sharing a menu with momo and dal bhat, for when the table can't agree.",
  },
  {
    slug: "vegetarian",
    name: "Vegetarian",
    href: "/nepali-food/vegetarian",
    blurb:
      "Veg momo, dal bhat, gundruk and paneer: meat-free Nepali cooking that never feels like an afterthought.",
  },
];

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
