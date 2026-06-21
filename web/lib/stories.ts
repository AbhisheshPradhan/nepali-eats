export type StoryBlock =
  | { type: "h2"; text: string }
  | { type: "p"; text: string } // inline [label](/href) links supported
  | { type: "list"; items: string[] } // items support inline links too
  | { type: "faq"; items: { q: string; a: string }[] };

export interface Story {
  slug: string;
  category: string;
  hue: number;
  readTime: string;
  author: string;
  date: string; // ISO published date, e.g. "2026-06-21"
  title: string;
  dek: string; // the snippet / standfirst shown on cards and as the lead line
  tags: string[];
  heroImage?: string; // optional image path; falls back to the gradient hero
  body: StoryBlock[];
}

export const STORIES: Story[] = [
  {
    slug: "nepali-food-australia-guide",
    category: "Food guide",
    hue: 35,
    readTime: "5 min read",
    author: "NepaliEats",
    date: "2026-06-21",
    title: "A Guide to Nepali Food in Australia: The Dishes You Need to Know",
    dek: "New to Nepali food? Here are the dishes to order first, from momo and Thakali dal bhat to Newari choila, and where to find them across Australia.",
    tags: ["Nepali food", "Momo", "Dal bhat", "Beginner"],
    body: [
      {
        type: "p",
        text: "Nepali food has quietly become one of the best things to eat in Australia. Walk through Harris Park in Sydney or Footscray in Melbourne and you will smell it before you see it: steamed dumplings, fried garlic, toasted spices. If you only know momo, you are in for a good few years of eating.",
      },
      {
        type: "p",
        text: "Here are the dishes worth knowing, what they taste like, and where to find them.",
      },
      { type: "h2", text: "Momo" },
      {
        type: "p",
        text: "Start here. Momo are Nepal's famous dumplings, filled with buff, chicken, veg or paneer, then steamed or fried and served with a fiery tomato achaar. Order them jhol style and they arrive in a warm, nutty, spiced soup. Order them C-momo and they come tossed in a sticky chilli sauce.",
      },
      {
        type: "p",
        text: "Momo are the gateway dish, the one nearly every Nepali kitchen does, and the reason most people fall for the food in the first place. We have a whole page for them: [the best momo in Australia](/momo).",
      },
      { type: "h2", text: "Thakali dal bhat" },
      {
        type: "p",
        text: "If momo is the snack, dal bhat is the meal. The Thakali version is the one to seek out: black dal, rice, gundruk, a curry or two, pickles and greens, all on one plate. The best part is the refills. A good Thakali set keeps topping you up until you wave the white flag.",
      },
      {
        type: "p",
        text: "Find the kitchens doing it properly on the [Thakali page](/tag/thakali).",
      },
      { type: "h2", text: "Newari food" },
      {
        type: "p",
        text: "The Newar people of the Kathmandu Valley have their own table, and it is some of the most exciting eating in Nepali cooking. Look for choila, smoky grilled meat tossed with mustard oil and spices, lentil bara that works like a savoury pancake, and samay baji, a sharing spread built around beaten rice.",
      },
      {
        type: "p",
        text: "It is sour, smoky and made for a group. Here is [where to find Newari food](/tag/newari).",
      },
      { type: "h2", text: "Tibetan and Nepali warmers" },
      {
        type: "p",
        text: "Nepal shares a long border and a lot of food with Tibet. That gives you thukpa, a hearty noodle soup, and laphing, cold and springy and tossed in chilli. Perfect for a cold day or a hot one. Browse the [Tibetan-Nepali spots](/tag/tibetan).",
      },
      { type: "h2", text: "Sides and sweets" },
      {
        type: "p",
        text: "Do not skip the edges of the menu. Gundruk is fermented leafy greens, sour and moreish. Sel roti is a sweet, ring-shaped rice bread, crisp outside and soft within. Finish with sikarni, a thick sweet yoghurt, or juju dhau if you can find it.",
      },
      { type: "h2", text: "Where to eat Nepali food in Australia" },
      {
        type: "p",
        text: "The scene is biggest in Victoria and New South Wales, but you will find Nepali kitchens in every state. Start with [Nepali restaurants in NSW](/nepali-restaurants/nsw) or [Victoria](/nepali-restaurants/vic), or open the map and find your closest spot.",
      },
      {
        type: "faq",
        items: [
          {
            q: "What should I order on my first visit?",
            a: "Get a plate of steamed momo to start, a Thakali dal bhat set for the full spread, and sel roti or sikarni to finish.",
          },
          {
            q: "Is Nepali food spicy?",
            a: "It can be, but most of the heat lives in the achaar on the side, so you control it. Ask the kitchen if you want it mild.",
          },
          {
            q: "Is there vegetarian Nepali food?",
            a: "Plenty. Veg momo, dal bhat and gundruk are everywhere. See the [vegetarian spots](/tag/vegetarian).",
          },
        ],
      },
      {
        type: "p",
        text: "Find your momo people. Open the map and see what is near you.",
      },
    ],
  },
  {
    slug: "best-momo-australia",
    category: "Dish guide",
    hue: 18,
    readTime: "4 min read",
    author: "NepaliEats",
    date: "2026-06-21",
    title: "Where to Find the Best Momo in Australia",
    dek: "Steamed, fried, jhol or C-momo? A quick guide to Nepal's famous dumplings and where to eat the best momo across Australia.",
    tags: ["Momo", "Dish guide"],
    body: [
      {
        type: "p",
        text: "Momo are the dish that put Nepali food on the map in Australia, and once you have had a good plate you understand why. Soft dumplings, a punchy achaar, and a queue out the door on a Sunday. Here is what to know, and where to eat them.",
      },
      { type: "h2", text: "What is momo?" },
      {
        type: "p",
        text: "Momo are Nepali dumplings, close cousins of the Tibetan momo and the wider dumpling family. A thin wheat wrapper holds a filling of buff (water buffalo), chicken, veg or paneer, seasoned with onion, garlic, ginger and Himalayan spices. They are served with achaar, a tomato and chilli relish that does most of the heavy lifting.",
      },
      { type: "h2", text: "The styles, explained" },
      { type: "p", text: "Half the fun is choosing how you want them." },
      {
        type: "list",
        items: [
          "Steamed: the classic. Soft, juicy, the truest taste of the filling.",
          "Fried: pan-fried or deep-fried for crisp, golden edges.",
          "Jhol momo: served in a warm, nutty, spiced soup you drink between bites.",
          "C-momo: chilli momo, tossed in a sticky, hot, slightly sweet sauce.",
        ],
      },
      {
        type: "p",
        text: "If it is your first time, get steamed buff momo and a side of jhol to dip into.",
      },
      { type: "h2", text: "The fillings" },
      {
        type: "p",
        text: "Buff is the traditional choice and what most Nepali regulars order. Chicken is the crowd-pleaser. Veg and paneer momo are everywhere and genuinely good, not an afterthought. See the [vegetarian spots](/tag/vegetarian) if that is your order.",
      },
      { type: "h2", text: "How to eat momo like a regular" },
      {
        type: "p",
        text: "Pick one up, dunk it in achaar, and eat it in one or two bites so the juice does not escape. Do not fill up on the first plate. Order a second style to compare. And never skip the achaar.",
      },
      { type: "h2", text: "Where to find the best momo" },
      {
        type: "p",
        text: "Momo turn up on nearly every Nepali menu in the country. The scene is densest in [New South Wales](/nepali-restaurants/nsw) and [Victoria](/nepali-restaurants/vic), with strong showings in [Western Australia](/nepali-restaurants/wa) and beyond.",
      },
      {
        type: "p",
        text: "The fastest way to find your closest plate is the [momo page](/momo). Sort by rating to see local favourites, or open the map and follow the queues.",
      },
      {
        type: "faq",
        items: [
          {
            q: "What does momo taste like?",
            a: "Savoury, juicy and aromatic, with the heat coming from the achaar on the side.",
          },
          {
            q: "Steamed or fried momo, which is better?",
            a: "Steamed for the purest flavour, fried for crisp edges. Most people end up ordering both.",
          },
          {
            q: "Are momo halal?",
            a: "Many kitchens serve halal momo or have halal options. Call ahead to confirm with the kitchen.",
          },
        ],
      },
      {
        type: "p",
        text: "Find your momo people. Open the map and see what is near you.",
      },
    ],
  },
  {
    slug: "what-is-thakali-dal-bhat",
    category: "Dish guide",
    hue: 168,
    readTime: "4 min read",
    author: "NepaliEats",
    date: "2026-06-21",
    title: "What Is Thakali Dal Bhat? A Beginner's Guide",
    dek: "Thakali dal bhat is Nepal's comfort food: dal, rice, gundruk and a spread of sides, with refills until you tap out. Here is what to expect and where to try it.",
    tags: ["Dal bhat", "Thakali", "Beginner"],
    body: [
      {
        type: "p",
        text: "If momo is the dish people try first, Thakali dal bhat is the one that makes them regulars. It is Nepal's comfort food, a complete meal on a single plate, and once you understand it you will order it every time.",
      },
      { type: "h2", text: "What is dal bhat?" },
      {
        type: "p",
        text: "Dal bhat means lentils and rice, the everyday meal eaten across Nepal, often twice a day. Dal is a spiced lentil soup. Bhat is steamed rice. On its own it is simple. The magic is in what comes with it.",
      },
      { type: "h2", text: "What makes it Thakali?" },
      {
        type: "p",
        text: "The Thakali people come from the Thak Khola valley along the old salt-trading route to Tibet, and they turned dal bhat into something special. A Thakali set arrives as a spread: a darker, richer black dal, rice, a meat or veg curry, gundruk (fermented greens), greens, and a row of pickles and chutneys.",
      },
      {
        type: "p",
        text: "It is balanced by design. Something sour, something spicy, something fresh, something rich, all in one sitting.",
      },
      { type: "h2", text: "The best part: the refills" },
      {
        type: "p",
        text: "A proper Thakali set is bottomless. Servers come back around with more rice, more dal and more sides until you tell them to stop. It is generous food, meant to leave you full and happy, and it is one of the best value meals you can order.",
      },
      { type: "h2", text: "How to eat it" },
      {
        type: "p",
        text: "Mix a little dal into your rice, add a pinch of pickle, and work your way around the plate so every bite is a little different. Use your right hand if you want the traditional way, or a fork and spoon. Pace yourself. The refills are coming.",
      },
      { type: "h2", text: "Where to try Thakali dal bhat" },
      {
        type: "p",
        text: "Look for kitchens that say Thakali on the sign or list a dal bhat set on the menu. They are spread across the country, with the most choice in [New South Wales](/nepali-restaurants/nsw) and [Victoria](/nepali-restaurants/vic).",
      },
      {
        type: "p",
        text: "See every spot serving it on the [Thakali page](/tag/thakali). New to Nepali food and want the lighter option first? Start with [momo](/momo).",
      },
      {
        type: "faq",
        items: [
          {
            q: "Is Thakali dal bhat vegetarian?",
            a: "It can be. Most sets come with a veg or meat option, and the dal, rice, gundruk and pickles are vegetarian by default.",
          },
          {
            q: "How spicy is it?",
            a: "Mild to medium on the plate, with the pickles bringing the heat. You control how much you add.",
          },
          {
            q: "Why do they keep refilling my plate?",
            a: "That is the tradition. A Thakali set is all you can eat by design, so accept the refills until you are full.",
          },
        ],
      },
      {
        type: "p",
        text: "Find your momo people. Open the map and see what is near you.",
      },
    ],
  },
];

export function getStory(slug: string) {
  return STORIES.find((s) => s.slug === slug) || null;
}

export function formatStoryDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function storyFaq(s: Story) {
  const block = s.body.find((b) => b.type === "faq");
  return block && block.type === "faq" ? block.items : [];
}
