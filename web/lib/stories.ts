export interface Story {
  slug: string;
  category: string;
  hue: number;
  readTime: string;
  author: string;
  date: string;
  title: string;
  dek: string;
  body: string[];
}

export const STORIES: Story[] = [
  {
    slug: "where-to-eat-momo-in-western-sydney",
    category: "City guide",
    hue: 18,
    readTime: "6 min read",
    author: "Maya Shrestha",
    date: "June 2026",
    title: "Where to eat momo in western Sydney",
    dek: "Harris Park to Rooty Hill: the steamy windows, the jhol momo, and the queues worth joining.",
    body: [
      "Western Sydney is, quietly, the momo capital of Australia. On any given evening the steamers are fogging up windows from Parramatta to Blacktown, and the only hard part is choosing.",
      "Start in Harris Park, where Thakali Kitchen plates a dal bhat set that locals drive across the city for. A few suburbs west, Himalayan Momo House has built a cult around its buff momo. Order the jhol, the soupy cousin that arrives swimming in a sesame-tomato broth.",
      "The rule of thumb: follow the queues, bring cash for the trucks, and never skip the achaar.",
    ],
  },
  {
    slug: "a-beginners-guide-to-nepali-food",
    category: "Dish guide",
    hue: 35,
    readTime: "5 min read",
    author: "NepaliEats",
    date: "May 2026",
    title: "A beginner's guide to Nepali food",
    dek: "New to momo, dal bhat and sel roti? Here's how to order your first proper Nepali meal.",
    body: [
      "Nepali food rewards the curious. If you only know momo, you are standing at the doorway of a much bigger, more generous kitchen.",
      "Begin with dal bhat: lentils, rice and a rotating cast of vegetable and pickle sides, the everyday meal that anchors the whole cuisine. Then branch into the Newari table: choila, bara, and samay baji platters built for sharing.",
      "Wash it down with milky masala chiya, and if there's sel roti at the counter, get one. It's a sweet, ring-shaped rice bread that tastes like celebration.",
    ],
  },
  {
    slug: "the-family-behind-newa-lahana",
    category: "Spotlight",
    hue: 350,
    readTime: "4 min read",
    author: "Anish Gurung",
    date: "May 2026",
    title: "The family behind Newa Lahana",
    dek: "In Sunshine, a Melbourne kitchen is cooking the way Kathmandu grandmothers intended.",
    body: [
      "Newa Lahana didn't set out to be a destination. It started as a way for one family to cook the Newari food they missed, and the city came knocking.",
      "The samay baji platter is the heart of the menu: beaten rice, fiery choila, egg, soybeans and more, each element with its own role. It's a meal that asks you to slow down.",
      "Come hungry, come with friends, and let them bring you whatever is freshest that day.",
    ],
  },
  {
    slug: "sel-roti-season-a-sweet-tradition",
    category: "Festival eats",
    hue: 168,
    readTime: "5 min read",
    author: "Maya Shrestha",
    date: "April 2026",
    title: "Sel roti season: a sweet tradition",
    dek: "During Tihar and Dashain, the markets fill with the smell of sel roti frying. Here's where to find it.",
    body: [
      "There's a particular smell to festival season: rice batter hitting hot oil, curling into golden rings of sel roti. For many Nepali Australians it's the smell of home.",
      "Around Tihar and Dashain, weekend markets and food trucks fry sel roti to order. Sweet, slightly crisp, best eaten warm in your hand.",
      "Keep an eye on the NepaliEats map during festival weeks; the pop-ups don't last long.",
    ],
  },
];

export function getStory(slug: string) {
  return STORIES.find((s) => s.slug === slug) || null;
}
