import { metroFromState, tagLabel, suburbSlug } from "./format";
import type { Restaurant } from "./types";

// Content model for the enriched landing pages (state / suburb / tag / momo).
// Hand-written local copy is merged with facts derived from the real restaurant
// rows (count, top suburbs, top states) so every page is genuinely unique, not a
// one-sentence-plus-grid near-duplicate. Inline links use the [label](/href)
// syntax rendered by components/inline.tsx.

export interface Crumb {
  label: string;
  href: string;
}
export interface CrossLinkGroup {
  heading: string;
  links: Crumb[];
}
export interface WhatToOrder {
  dish: string;
  note: string; // inline links supported
}
export interface LandingContent {
  breadcrumbs: Crumb[];
  eyebrow: string;
  title: string;
  intro: string[]; // paragraphs, inline links supported
  whatToOrder?: WhatToOrder[];
  faq?: { q: string; a: string }[];
  crossLinks?: CrossLinkGroup[];
  exploreHref?: string;
  collectionName: string;
}

const STATE_NAME: Record<string, string> = {
  NSW: "New South Wales",
  VIC: "Victoria",
  QLD: "Queensland",
  WA: "Western Australia",
  SA: "South Australia",
  ACT: "the ACT",
  TAS: "Tasmania",
  NT: "the Northern Territory",
};
const STATE_CODES = ["NSW", "VIC", "QLD", "WA", "SA", "ACT", "TAS", "NT"];

// Count occurrences of a field across the list, sorted most-common first.
function topBy(
  list: Restaurant[],
  field: "suburb" | "state"
): { value: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const r of list) {
    const v = r[field];
    if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
}

// Join a list of names into readable prose: "A, B and C".
function proseList(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

// The classic Nepali order, reused on state/suburb pages (it is genuinely the
// answer to "what do I get at a Nepali place"). Each note cross-links a dish hub.
const NEPALI_CLASSICS: WhatToOrder[] = [
  {
    dish: "Momo",
    note: "Nepal's famous dumplings, steamed or fried and served with a fiery tomato achaar. The gateway dish. [Find momo near you](/momo).",
  },
  {
    dish: "Thakali dal bhat",
    note: "The full plate: black dal, rice, gundruk, a curry and pickles, with refills until you tap out. [Thakali spots](/nepali-food/thakali).",
  },
  {
    dish: "Newari choila",
    note: "Smoky grilled meat tossed with mustard oil and spices, made for sharing. [Newari food](/nepali-food/newari).",
  },
  {
    dish: "Sel roti",
    note: "A sweet, ring-shaped rice bread, crisp outside and soft within. Finish with sikarni if it is on.",
  },
];

// Hand-written lead copy per state (local detail a template can't fake). The
// builder appends a data sentence with the real count + cluster suburbs.
const STATE_LEAD: Record<string, string[]> = {
  NSW: [
    "Sydney is the beating heart of Nepali food in Australia. Head west and the momo capital reveals itself: Harris Park and Parramatta run thick with dumpling houses, and you will find Thakali kitchens and buff momo through Auburn, Rockdale and Liverpool.",
    "It is the densest, most competitive Nepali food scene in the country, which is good news for your dinner. The food follows the students and families too, so there are good spots in Wollongong, Newcastle and the coast.",
  ],
  VIC: [
    "Melbourne's Nepali food lives in the west. Footscray, Sunshine and St Albans have long been the heartland, and the newer estates out at Tarneit and Point Cook now have their own momo locals.",
    "The city does everything from weekend jhol momo to full Thakali sets and Newari feasts. It is second only to Sydney for choice, and closing the gap.",
  ],
  QLD: [
    "Brisbane carries Queensland's Nepali food, with the biggest clusters around Sunnybank, Moorooka and the southern suburbs. The Gold Coast has its own growing handful of momo kitchens and Nepali-Indian diners.",
    "Expect proper momo, generous Thakali sets and the kind of warm service that makes you a regular.",
  ],
  WA: [
    "Perth's Nepali scene sits south and east of the river, strongest around Canning Vale, Willetton and Cannington, with a few good spots in Northbridge for a night out.",
    "It is a tight-knit community, and the momo, Thakali sets and thali plates show it.",
  ],
  SA: [
    "Adelaide keeps its Nepali food close to the city and the inner suburbs. It is a smaller scene than the eastern capitals, but the momo is honest and the Thakali sets are the real thing.",
    "A short list worth working through if you love this food.",
  ],
  ACT: [
    "Canberra punches above its weight for Nepali food, helped by a big student and public-service Nepali community. You will find momo, Thakali dal bhat and Newari plates across the inner north and the town centres.",
    "For a small city, there is a lot of good eating here.",
  ],
  TAS: [
    "Tasmania's Nepali kitchens cluster in Hobart and Launceston, run by a small but growing community. Not many spots, but the ones here take their momo seriously.",
    "Worth the trip if you find yourself down south and craving dumplings.",
  ],
  NT: [
    "Darwin's handful of Nepali kitchens bring momo and dal bhat to the Top End. A small scene, but a welcome one when the heat calls for something warming and spiced.",
    "Start with the momo and see where the menu takes you.",
  ],
};

// Hand-written copy per dish tag. `title`/`eyebrow` override the generated
// defaults where a natural phrasing beats the slug label.
interface TagCopy {
  eyebrow?: string;
  title?: string;
  lead: string[];
  whatToOrder?: WhatToOrder[];
  faq?: { q: string; a: string }[];
}
const TAG_COPY: Record<string, TagCopy> = {
  momo: {
    eyebrow: "Find your momo people",
    title: "Best momo in Australia",
    lead: [
      "Momo are the dish that put Nepali food on the map in Australia. Soft dumplings, a punchy tomato achaar, and a queue out the door on a Sunday. Nearly every Nepali kitchen in the country does them, and the good ones do them brilliantly.",
      "Order them steamed for the truest taste, fried for crisp edges, jhol for a warm spiced soup you drink between bites, or C-momo tossed in sticky chilli sauce. Buff is the traditional filling, chicken the crowd-pleaser, and veg and paneer are everywhere and genuinely good.",
    ],
    whatToOrder: [
      { dish: "Steamed momo", note: "The classic. Soft, juicy, the truest taste of the filling." },
      { dish: "Jhol momo", note: "Served swimming in a warm, nutty, spiced soup. Order this when it is cold out." },
      { dish: "C-momo", note: "Chilli momo, tossed in a sticky, hot, slightly sweet sauce." },
      { dish: "Fried momo", note: "Pan or deep fried for golden, crunchy edges." },
    ],
    faq: [
      { q: "What does momo taste like?", a: "Savoury, juicy and aromatic, with the heat coming from the achaar on the side." },
      { q: "Steamed or fried momo, which is better?", a: "Steamed for the purest flavour, fried for crisp edges. Most people end up ordering both." },
      { q: "Are momo halal?", a: "Many kitchens serve halal momo or have halal options. Call ahead to confirm with the kitchen." },
    ],
  },
  thakali: {
    title: "Thakali dal bhat across Australia",
    lead: [
      "If momo is the snack, Thakali dal bhat is the meal. The Thakali people turned Nepal's everyday dal and rice into a spread: a darker, richer black dal, rice, a curry, gundruk, greens and a row of pickles, all on one plate.",
      "The best part is the refills. A proper Thakali set keeps topping you up with rice, dal and sides until you wave the white flag. It is one of the best value meals you can order anywhere.",
    ],
    whatToOrder: [
      { dish: "Thakali dal bhat set", note: "The full spread, with bottomless refills. Ask for the meat or veg version." },
      { dish: "Gundruk", note: "Fermented leafy greens, sour and moreish, usually part of the set." },
      { dish: "Black dal", note: "The richer, darker lentil that sets a Thakali plate apart." },
    ],
    faq: [
      { q: "Is Thakali dal bhat vegetarian?", a: "It can be. Most sets come with a veg or meat option, and the dal, rice, gundruk and pickles are vegetarian by default." },
      { q: "Why do they keep refilling my plate?", a: "That is the tradition. A Thakali set is all you can eat by design, so accept the refills until you are full." },
      { q: "What makes a set Thakali?", a: "A darker black dal, gundruk, and a balanced spread of sour, spicy, fresh and rich, all in one sitting." },
    ],
  },
  newari: {
    title: "Newari food across Australia",
    lead: [
      "The Newar people of the Kathmandu Valley have their own table, and it is some of the most exciting eating in Nepali cooking. It is sour, smoky, spiced and made for sharing.",
      "Look for choila, samay baji and lentil bara. Order a spread, bring a group, and work your way around the plate.",
    ],
    whatToOrder: [
      { dish: "Choila", note: "Smoky grilled meat tossed with mustard oil, garlic and spices." },
      { dish: "Bara", note: "A savoury lentil pancake, crisp at the edges." },
      { dish: "Samay baji", note: "A sharing platter built around beaten rice, with meat, egg, soybeans and pickles." },
    ],
    faq: [
      { q: "What is samay baji?", a: "A traditional Newari sharing platter of beaten rice with choila, egg, soybeans, greens and pickles. Order it for the table." },
      { q: "Is Newari food spicy?", a: "It leans smoky and sour more than hot, though the achaar and pickles bring heat if you want it." },
    ],
  },
  vegetarian: {
    eyebrow: "Eat by craving",
    title: "Vegetarian Nepali food across Australia",
    lead: [
      "Vegetarian eating is easy at a Nepali table. Veg momo, dal bhat, gundruk and paneer dishes are on almost every menu, and none of it feels like an afterthought.",
      "These are the kitchens doing generous, meat-free Nepali cooking across the country.",
    ],
    whatToOrder: [
      { dish: "Veg momo", note: "Steamed or fried dumplings filled with cabbage, carrot and paneer." },
      { dish: "Dal bhat", note: "Lentils, rice, greens and pickles, vegetarian by default." },
      { dish: "Aloo tama", note: "A tangy potato and bamboo-shoot curry, a Nepali vegetarian classic." },
    ],
    faq: [
      { q: "Is Nepali vegetarian food also vegan?", a: "Not always. Ghee, paneer and yoghurt turn up often, so ask the kitchen if you need a strictly vegan plate." },
      { q: "What should a first-time vegetarian order?", a: "Start with veg momo, add a dal bhat set, and try aloo tama or a paneer curry on the side." },
    ],
  },
  tibetan: {
    title: "Tibetan and Nepali warmers across Australia",
    lead: [
      "Nepal shares a long border and a lot of food with Tibet, and these kitchens bring the warmers. Think thukpa, laphing and, of course, momo.",
      "Perfect for a cold day, or a hot one when you want something with a kick.",
    ],
    whatToOrder: [
      { dish: "Thukpa", note: "A hearty Tibetan noodle soup, perfect for a cold night." },
      { dish: "Laphing", note: "Cold, springy mung-bean noodles tossed in chilli." },
      { dish: "Momo", note: "The Tibetan-Nepali dumpling that started it all." },
    ],
    faq: [
      { q: "What is laphing?", a: "A cold Tibetan noodle dish, springy and slippery, tossed in a garlicky chilli sauce. Not for the heat-shy." },
    ],
  },
  "nepali-indian": {
    title: "Nepali-Indian restaurants across Australia",
    lead: [
      "Plenty of Nepali kitchens share a menu with Indian cooking, turning out curries, tandoor and biryani alongside momo and dal bhat. Handy when the table cannot agree.",
      "These spots let you order a plate of momo and a butter chicken in the same sitting.",
    ],
    whatToOrder: [
      { dish: "Momo", note: "The Nepali side of the menu. Do not skip it for the curries." },
      { dish: "Curries", note: "Butter chicken, goat curry and the Indian classics, done well." },
      { dish: "Tandoori", note: "Clay-oven grilled meats and fresh naan." },
    ],
  },
};

// Shared cross-link group linking the main dish hubs, minus whichever tag is
// the current page.
function dishLinks(exclude?: string): CrossLinkGroup {
  const all: Crumb[] = [
    { label: "Momo", href: "/momo" },
    { label: "Thakali dal bhat", href: "/nepali-food/thakali" },
    { label: "Newari", href: "/nepali-food/newari" },
    { label: "Vegetarian", href: "/nepali-food/vegetarian" },
    { label: "Tibetan", href: "/nepali-food/tibetan" },
    { label: "Nepali-Indian", href: "/nepali-food/nepali-indian" },
  ];
  const links = all.filter(
    (l) => l.href !== (exclude === "momo" ? "/momo" : `/nepali-food/${exclude}`)
  );
  return { heading: "By dish", links };
}

function stateLinks(exclude?: string, only?: string[]): CrossLinkGroup {
  const codes = (only ?? STATE_CODES).filter((c) => c !== exclude);
  return {
    heading: "By state",
    links: codes.map((c) => ({
      label: STATE_NAME[c] ?? c,
      href: `/nepali-restaurants/${c.toLowerCase()}`,
    })),
  };
}

export function stateLanding(state: string, list: Restaurant[]): LandingContent {
  const name = STATE_NAME[state] ?? state;
  const metro = metroFromState(state);
  const suburbs = topBy(list, "suburb");
  const clusters = suburbs.slice(0, 3).map((s) => s.value);
  const lead = STATE_LEAD[state] ?? [
    `Every kitchen, cafe and takeaway serving Nepali food across ${name}. Momo, Thakali dal bhat, Newari plates and more, gathered in one place.`,
  ];
  const dataSentence =
    clusters.length > 0
      ? `We have mapped ${list.length} Nepali spots across ${name}, with the biggest clusters in ${proseList(clusters)}.`
      : `We have mapped ${list.length} Nepali spots across ${name}.`;

  const suburbLinks: Crumb[] = suburbs
    .filter((s) => s.count >= 2)
    .slice(0, 8)
    .map((s) => ({
      label: `${s.value} (${s.count})`,
      href: `/nepali-restaurants/${suburbSlug(s.value, state)}`,
    }));

  const crossLinks: CrossLinkGroup[] = [];
  if (suburbLinks.length)
    crossLinks.push({ heading: `Suburbs in ${name}`, links: suburbLinks });
  crossLinks.push(dishLinks());
  crossLinks.push(stateLinks(state));

  return {
    breadcrumbs: [
      { label: "Home", href: "/" },
      { label: "Nepali restaurants", href: "/explore" },
      { label: name, href: `/nepali-restaurants/${state.toLowerCase()}` },
    ],
    eyebrow: `All across ${state}`,
    title: `Nepali restaurants in ${name}`,
    intro: [...lead, dataSentence],
    whatToOrder: NEPALI_CLASSICS,
    faq: [
      {
        q: `Where is the best Nepali food in ${metro}?`,
        a: clusters.length
          ? `The densest clusters are in ${proseList(clusters)}. Sort any list by rating to see local favourites, or open the map to find your closest plate.`
          : `Sort the list by rating to see local favourites, or open the map to find your closest plate.`,
      },
      {
        q: `Do Nepali restaurants in ${name} serve momo?`,
        a: `Nearly all of them. Momo is the dish almost every Nepali kitchen does, steamed, fried, jhol or C-momo. See the [momo page](/momo) for the spots known for it.`,
      },
      {
        q: `Is there vegetarian Nepali food in ${name}?`,
        a: `Plenty. Veg momo, dal bhat and gundruk are on most menus. Browse the [veg-friendly spots](/nepali-food/vegetarian).`,
      },
    ],
    crossLinks,
    exploreHref: `/explore?state=${state}`,
    collectionName: `Nepali restaurants in ${name}`,
  };
}

export function suburbLanding(
  suburb: string,
  state: string,
  list: Restaurant[]
): LandingContent {
  const name = STATE_NAME[state] ?? state;
  const count = list.length;
  return {
    breadcrumbs: [
      { label: "Home", href: "/" },
      { label: name, href: `/nepali-restaurants/${state.toLowerCase()}` },
      { label: suburb, href: `/nepali-restaurants/${suburbSlug(suburb, state)}` },
    ],
    eyebrow: `${suburb}, ${state}`,
    title: `Nepali restaurants in ${suburb}`,
    intro: [
      `The kitchens, cafes and takeaways serving Nepali food in ${suburb}, ${state}. Momo, Thakali dal bhat and more, all close to home.`,
      count > 0
        ? `We have ${count} Nepali ${count === 1 ? "spot" : "spots"} mapped in ${suburb}. Sort by rating to find the local favourite, or open the map for the closest plate.`
        : `Open the map to find Nepali food near ${suburb}.`,
    ],
    whatToOrder: NEPALI_CLASSICS,
    crossLinks: [
      {
        heading: "Nearby",
        links: [
          { label: `All of ${name}`, href: `/nepali-restaurants/${state.toLowerCase()}` },
        ],
      },
      dishLinks(),
    ],
    exploreHref: `/explore?suburb=${encodeURIComponent(suburb)}`,
    collectionName: `Nepali restaurants in ${suburb}, ${state}`,
  };
}

// A state block for the curated dish hubs (e.g. /momo): the top spots in one
// state plus a link to the full set. `list` must already be ordered best-first
// (listRestaurants default), so slicing takes the top N.
export interface LandingGroup {
  state: string;
  stateName: string;
  total: number;
  spots: Restaurant[];
  href: string;
}
export function groupByState(
  list: Restaurant[],
  tag: string,
  perState = 6
): LandingGroup[] {
  const map = new Map<string, Restaurant[]>();
  for (const r of list) {
    if (!r.state) continue;
    const g = map.get(r.state) ?? [];
    g.push(r);
    map.set(r.state, g);
  }
  return [...map.entries()]
    .map(([state, spots]) => ({
      state,
      stateName: STATE_NAME[state] ?? state,
      total: spots.length,
      spots: spots.slice(0, perState),
      href: `/explore?tag=${encodeURIComponent(tag)}&state=${state}`,
    }))
    .sort((a, b) => b.total - a.total);
}

export function tagLanding(tag: string, list: Restaurant[]): LandingContent {
  const label = tagLabel(tag);
  const copy = TAG_COPY[tag];
  const states = topBy(list, "state");
  const topStateCodes = states.map((s) => s.value).slice(0, 6);
  const title = copy?.title ?? `${label} across Australia`;
  const isMomo = tag === "momo";

  const dataSentence =
    states.length > 0
      ? `We have mapped ${list.length} spots serving it, from ${proseList(
          states.slice(0, 3).map((s) => STATE_NAME[s.value] ?? s.value)
        )} and beyond.`
      : `We have mapped ${list.length} spots serving it across Australia.`;

  const crossLinks: CrossLinkGroup[] = [
    stateLinks(undefined, topStateCodes),
    dishLinks(tag),
  ];

  return {
    breadcrumbs: [
      { label: "Home", href: "/" },
      { label: "By dish", href: "/explore" },
      { label: label, href: isMomo ? "/momo" : `/nepali-food/${tag}` },
    ],
    eyebrow: copy?.eyebrow ?? "Eat by craving",
    title,
    intro: [
      ...(copy?.lead ?? [
        `Every spot serving ${label} Nepali food, gathered in one place.`,
      ]),
      dataSentence,
    ],
    whatToOrder: copy?.whatToOrder,
    faq: copy?.faq,
    crossLinks,
    exploreHref: isMomo ? "/explore?tag=momo" : `/explore?tag=${encodeURIComponent(tag)}`,
    collectionName: title,
  };
}
