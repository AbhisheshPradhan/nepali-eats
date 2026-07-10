export type StoryBlock =
  | { type: "h2"; text: string }
  | { type: "p"; text: string } // inline [label](/href) links supported
  | { type: "list"; items: string[] } // items support inline links too
  | { type: "image"; src: string; alt: string; caption?: string; credit?: string }
  | { type: "faq"; items: { q: string; a: string }[] }
  // A grid of live restaurant cards, resolved from slugs at render time. Use for
  // the "where to eat" payoff and city-guide roundups, NOT for spots named in
  // flowing prose (those stay inline links).
  | { type: "places"; title?: string; slugs: string[] };

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
    slug: "kwati",
    category: "Festival food",
    hue: 96,
    readTime: "6 min read",
    author: "Aasha Shrestha",
    date: "2026-07-05",
    title: "Kwati: The Nine-Bean Soup Nepalis Eat When the Rains Come",
    dek: "Kwati is a thick soup of nine sprouted beans, cooked for Janai Purnima at the height of the monsoon. What it is, why we eat it, how to make it at home, and where to find it in Australia.",
    tags: ["Kwati", "Newari food", "Festival food", "Janai Purnima"],
    heroImage: "/blog/kwati-bowl.jpeg",
    body: [
      {
        type: "p",
        text: "Every year at the tail end of the monsoon, my grandmother would start soaking beans days before anyone was allowed to touch them. By the time Janai Purnima came around the kitchen smelled of jimbu and wet earth, and there was a pot of kwati on the stove big enough to feed the street. It is the dish I make when I miss home the most.",
      },
      {
        type: "p",
        text: "Kwati is a soup of nine sprouted beans, thick, earthy and quietly medicinal, cooked at the height of the rainy season. Here is what it is, why we eat it when we do, how to make it at home, and the handful of kitchens serving it in Australia.",
      },
      { type: "h2", text: "What is kwati?" },
      {
        type: "p",
        text: "Kwati (say it kwah-tee) is a thick soup of nine different beans, sprouted for a few days until they just start to tail, then simmered with ginger, garlic, timur and jimbu until everything goes soft and the broth turns nutty and dark. The name comes from the Newari words for nine and hot, a hot dish of nine beans. It is hearty in a way most soups are not. You can almost stand a spoon in a good pot of it.",
      },
      {
        type: "p",
        text: "It tastes of the beans themselves, roasty and grounding, lifted by the woodsy hit of jimbu and a slow warmth from the timur. Some homes keep it vegetarian, some drop in a little smoked pork or dried fish. Either way it eats like a meal, ladled over rice, not a starter.",
      },
      { type: "h2", text: "Why nine beans, and why the monsoon" },
      {
        type: "p",
        text: "Kwati belongs to Janai Purnima, the full-moon day of Saaun (in 2026 it falls on Friday 28 August), when men change the sacred thread they wear and everyone, thread or not, eats a bowl of kwati. Newars call the same day Kwati Punhi, the full moon of kwati. It lands deep in the monsoon, the season of damp, aches and sluggish digestion, and the soup is the old answer to all three.",
      },
      {
        type: "p",
        text: "Sprouted beans sit easier on the stomach and carry the kind of warming, strengthening food you want when it has rained for six weeks straight. Grandmothers will tell you kwati keeps the monsoon chill out of your joints. Believe the folk medicine or not, a bowl of it on a grey wet day makes its own case.",
      },
      { type: "h2", text: "The nine beans" },
      {
        type: "p",
        text: "There is no single fixed list, every family has its own, but a classic kwati leans on these nine:",
      },
      {
        type: "list",
        items: [
          "Mung bean (moong)",
          "Black gram (kalo maas)",
          "Chickpea (chana)",
          "Field bean (bakullah)",
          "Soybean (bhatmas)",
          "Black-eyed bean (bodi)",
          "Kidney bean (rajma)",
          "Garden pea (kerau)",
          "Rice bean (masyang)",
        ],
      },
      {
        type: "image",
        src: "/blog/kwati-beans.jpeg",
        alt: "The mix of nine beans and pulses for kwati, soaking before they sprout",
        caption:
          "The nine beans, soaked overnight and left to sprout for a few days before they go anywhere near the pot.",
      },
      {
        type: "p",
        text: "Sprouting is the real work, and it is why kwati is a festival dish and not a weeknight one. You soak the beans, drain them, and leave them wrapped somewhere warm for two to three days until each one grows a small tail. That is the part you cannot rush.",
      },
      { type: "h2", text: "How to make kwati at home" },
      {
        type: "p",
        text: "None of the cooking is hard once the beans are sprouted. Here is the way I make it.",
      },
      {
        type: "list",
        items: [
          "3 to 4 cups mixed sprouted beans (the nine above)",
          "1 tbsp ghee or oil",
          "1 tsp jimbu, or a pinch of cumin seeds if you cannot find it",
          "1 large onion, finely chopped",
          "1 tbsp ginger-garlic paste",
          "1 tsp turmeric, 1 tsp ground cumin, 1 tsp ground coriander",
          "1/2 tsp timur, lightly crushed",
          "1 to 2 dried red chillies",
          "Salt, and fresh coriander to finish",
        ],
      },
      {
        type: "list",
        items: [
          "Heat the ghee and fry the jimbu and dried chilli for a few seconds, until fragrant.",
          "Add the onion and ginger-garlic paste and cook down until soft and golden.",
          "Stir in the turmeric, cumin and coriander, then the sprouted beans, and coat them in the spice.",
          "Pour in enough water to cover well, bring to a boil, then simmer 30 to 40 minutes until the beans are tender and the broth thickens.",
          "Crush in the timur near the end, season with salt, and finish with coriander. Serve hot over rice.",
        ],
      },
      {
        type: "p",
        text: "If you want it the way many Newar homes do, drop in a little smoked pork or dried fish with the onions. And do not skip the timur at the end. It is the difference between a bean soup and kwati.",
      },
      { type: "h2", text: "Where to eat kwati in Australia" },
      {
        type: "p",
        text: "Kwati is a festival and home dish, so it is not on every menu the way momo is. A few kitchens do run it, though, and these are the ones worth seeking out:",
      },
      {
        type: "places",
        slugs: [
          "namaste-nepalese-restaurant-parkside",
          "taste-of-nepal-norwood",
          "nepal-dining-room",
          "spice-mix-indian-nepalese-halal-restaurant-melbourne",
        ],
      },
      {
        type: "p",
        text: "At Spice Mix in Brunswick East it hides on the menu as a sprouted mixed-lentil bowl, so look for that. If none of these are near you, the next best thing is a Newari kitchen. The same cooks who make kwati for Kwati Punhi also do [choila](/nepali-food/choila), bara and samay baji. Start with [Newari food](/nepali-food/newari), or open the [map](/explore) and find your closest Nepali kitchen. Around Janai Purnima, Friday 28 August in 2026, it is worth ringing ahead to ask if they are running a pot.",
      },
      {
        type: "faq",
        items: [
          {
            q: "What is kwati?",
            a: "Kwati is a Nepali soup of nine sprouted beans, simmered with ginger, garlic, timur and jimbu. It is thick, earthy and eaten over rice, traditionally at the Janai Purnima festival.",
          },
          {
            q: "When do Nepalis eat kwati?",
            a: "On Janai Purnima, the full moon of Saaun, also called Kwati Punhi. In 2026 that is Friday 28 August. It falls in the monsoon, and the soup is considered warming and good for you in the wet season.",
          },
          {
            q: "Is kwati vegetarian?",
            a: "It can be. The classic version is vegetarian, though many Newar homes add smoked pork or dried fish. Ask the kitchen if you want it one way or the other.",
          },
          {
            q: "Which nine beans go in kwati?",
            a: "It varies by family, but a common mix is mung, black gram, chickpea, field bean, soybean, black-eyed bean, kidney bean, garden pea and rice bean.",
          },
        ],
      },
      {
        type: "p",
        text: "That is kwati: nine beans, one full moon, and the taste of a Nepali monsoon in a bowl. Find your momo people, and come August, find your bowl of kwati.",
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
