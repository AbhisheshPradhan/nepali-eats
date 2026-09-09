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
    slug: "dashain-in-australia",
    category: "Festival food",
    hue: 28,
    readTime: "9 min read",
    author: "Aasha Shrestha",
    date: "2026-09-09",
    title: "Dashain in Australia: the goat, the tika and where to eat it",
    dek: "Dashain runs from Sunday 11 October to Sunday 25 October in 2026, and tika falls on a Wednesday. What we cook for it, why the goat is the whole point, and the kitchens doing khasi ko masu in every state if you are not cooking this year.",
    tags: ["Dashain", "Festival food", "Khasi ko masu", "Sel roti"],
    heroImage: "/blog/dashain-khasi-ko-masu.jpeg",
    body: [
      {
        type: "p",
        text: "The first sign of Dashain in our house was never the tika. It was my father coming back from the butcher with more meat than the fridge could take, and my mother clearing the bottom shelf two days early because she knew exactly what was coming.",
      },
      {
        type: "p",
        text: "Dashain is the biggest festival Nepal has, fifteen days of it, and it runs on goat, rice and whoever you can get in one room. Here is when it falls in 2026, what actually goes on the plate, and where to eat it in Australia if this is not the year you cook.",
      },
      { type: "h2", text: "When Dashain falls in 2026" },
      {
        type: "p",
        text: "Dashain starts on Sunday 11 October 2026 with Ghatasthapana, when the jamara is sown, and finishes on Sunday 25 October at Kojagrat Purnima. The days people mark in between:",
      },
      {
        type: "list",
        items: [
          "Ghatasthapana, Sunday 11 October: barley seeds sown in soil, kept dark, watered daily for the jamara.",
          "Phulpati, Saturday 17 October: the flowers and leaves come in, and the cooking starts in earnest.",
          "Maha Ashtami, Sunday 18 October: the big meat day in most homes.",
          "Bijaya Dashami, Wednesday 21 October: tika and jamara from your elders. This is the day people mean when they say Dashain.",
          "Kojagrat Purnima, Sunday 25 October: the full moon that closes it out.",
        ],
      },
      {
        type: "p",
        text: "Tika lands on a Wednesday this year, which in Australia means the feast will not. Nearly every family I know will do the real thing on the weekend either side, Sunday 18 or Saturday 24 October, and keep Wednesday for the tika itself after work. If you are ringing a restaurant or a caterer, those two weekends are the ones that book out.",
      },
      {
        type: "p",
        text: "One more piece of timing. Kathmandu runs five and a quarter hours behind Sydney in October, so if you are taking tika over video call from your parents at home, their auspicious hour lands in your early evening. Plan dinner around it, not the other way round.",
      },
      { type: "h2", text: "What is actually on the plate" },
      {
        type: "p",
        text: "Dashain food is not subtle and it is not meant to be. The centre of it is khasi ko masu, goat curry, cooked on the bone in mustard oil with ginger, garlic, turmeric, cumin and a lot of onion, simmered until the meat gives up and the gravy goes dark and sticky from the bones. Eaten over rice with your hands, with a spoonful of aloo ko achar on the side to cut through it.",
      },
      {
        type: "p",
        text: "Around it, depending on whose house you are in: sel roti, the crisp-edged sweet rice ring, fried in coils and torn apart while still warm. Kheer, thick with cardamom, made in a pot big enough to feed the street. Sekuwa off the grill for the people standing around drinking. In Newar homes like the one I grew up in, add bara, choila and a full samay baji spread, because a Newar family will find a reason to lay out samay baji for anything.",
      },
      {
        type: "p",
        text: "The rhythm matters more than any single dish. Dashain is the fortnight when meat is on the table every single day, in a food culture where the rest of the year it mostly is not. That is the whole feeling of it.",
      },
      { type: "h2", text: "The goat is the whole point" },
      {
        type: "p",
        text: "At home, families pool money and buy a whole animal between them, then divide it. That is why Dashain cooking looks the way it does: you have every part of the goat at once, so you cook every part of the goat. The offal goes first, because it will not keep. Khasi ko bhutan, the stomach, intestine and liver boiled then pan-fried hard with spices, is the drinking snack of the fortnight. Khutti, the leg, goes into a soup. Even the tongue turns up on a plate.",
      },
      {
        type: "p",
        text: "In Australia the pooling still happens, it just runs through a halal butcher and a group chat instead of the neighbours. People order weeks ahead, split a goat four or five ways, and lose a freezer to it until November. If you are trying to buy goat in the week of Dashain itself, you are already late.",
      },
      {
        type: "p",
        text: "Worth knowing when you read a menu here: khasi ko masu and khasi ko bhutan are not the same order. Masu is the curry. Bhutan is the offal fry, and it is properly good, but it is not what you want if you came for a plate of goat curry and rice. A few kitchens go further down the animal. Kutumba Lounge in Unley runs a khasi ko khutti soup, the goat-leg one, and [Sukuti Ghar](/restaurant/sukuti-ghar-granville) in Granville will sell you a khasi ko jibro set, which is tongue. Order it. You can thank me after.",
      },
      { type: "h2", text: "Sel roti, kheer and the sweet end" },
      {
        type: "p",
        text: "Sel roti is the thing people outside the family notice first, because it looks like a doughnut and tastes like nothing they were expecting: crisp right at the edge, chewy in the middle, faintly sweet, faintly sour from the rice batter resting overnight. It belongs to both Dashain and Tihar, and it is the one Dashain food that is genuinely hard to buy here. Only a handful of kitchens fry it, most of them takeaway counters rather than restaurants, and six of the ones we know about are in Perth.",
      },
      {
        type: "p",
        text: "Kheer closes the meal, and in a lot of homes so does a plate of whatever sweets came in the door with the last set of visitors. Nobody is precise about this part. By day four you are eating meat, rice and sweets in an order decided entirely by who has just arrived.",
      },
      { type: "h2", text: "How Dashain works when you live here" },
      {
        type: "p",
        text: "The jamara is the bit people improvise hardest. Barley seed in an ice cream container on a sunny windowsill, covered with a tea towel, watered every day and hidden from the light so it comes up that pale yellow-green. It works. I have taken tika from jamara grown next to a Sydney laundry sink and it counted just the same.",
      },
      {
        type: "p",
        text: "Tika comes from your elders, so if your parents are still in Nepal you go to whoever is oldest in your circle here, and that is usually how the Sunday ends up at one house with forty people in it. There will be cards. There will be someone flying a kite badly at a park that is not designed for it. There will be a queue at the halal butcher two weeks earlier that tells you Dashain is close more reliably than any calendar.",
      },
      { type: "h2", text: "Where to eat khasi ko masu if you are not cooking" },
      {
        type: "p",
        text: "Plenty of years you do not cook. The freezer plan fell through, or it is a Wednesday and you have work. Goat curry is on menus in every state and territory, and these are good places to start, one for each:",
      },
      {
        type: "places",
        slugs: [
          "khaja-villawood",
          "the-summit-indian-nepalese-restaurant",
          "8848-momo-house-forest-lake-forest-lake",
          "rolling-flavors-subiaco",
          "everest-tea-house-hallett-cove",
          "lakeside-gurkhas-kingston",
          "everest-eatery-indian-nepalese-cuisine-hobart",
          "yogis-way-stuart-park",
        ],
      },
      {
        type: "p",
        text: "If you are feeding a crowd rather than a table, ring a caterer instead, and ring early. [Prisha Catering and Events](/restaurant/prisha-catering-and-events-yennora) in Yennora, [Everest Function Centre](/restaurant/everest-function-centre-rockdale) in Rockdale and [Anu Kitchen](/restaurant/anu-kitchen-and-catering-services-campsie) in Campsie all do Nepali catering, and the two weekends around 18 and 24 October are the ones everyone wants. Two to four weeks of notice is normal, more if you want goat rather than chicken.",
      },
      {
        type: "p",
        text: "One honest note on halal. Most Nepali kitchens here buy from halal butchers because that is who sells goat, but almost none of them advertise it and we do not list it as a fact we can stand behind. Ring and ask the kitchen directly. They will tell you straight.",
      },
      {
        type: "p",
        text: "For the rest of the spread, a [Newari kitchen](/nepali-food/newari) will cover bara, choila and samay baji, a [sekuwa](/nepali-food/sekuwa) house handles the grill, and if the kids only want [momo](/momo), that is a Dashain tradition too now. Open the [map](/explore) and find what is closest to you.",
      },
      {
        type: "faq",
        items: [
          {
            q: "When is Dashain in 2026?",
            a: "Dashain runs from Sunday 11 October 2026 (Ghatasthapana) to Sunday 25 October (Kojagrat Purnima). Bijaya Dashami, the main tika day, is Wednesday 21 October 2026.",
          },
          {
            q: "What food do Nepalis eat for Dashain?",
            a: "Khasi ko masu (bone-in goat curry) with rice and aloo ko achar is the centrepiece, alongside sel roti, kheer, sekuwa off the grill and khasi ko bhutan, the fried goat offal. Newar families add bara, choila and a samay baji spread.",
          },
          {
            q: "What is khasi ko masu?",
            a: "Goat curry cooked on the bone in mustard oil with ginger, garlic, turmeric, cumin and onion, simmered long enough that the gravy thickens from the bones. It is the dish Dashain is built around, and it is different from khasi ko bhutan, which is fried goat offal.",
          },
          {
            q: "Where can I order a Dashain feast in Australia?",
            a: "Several Nepali kitchens cater, including Prisha Catering and Events in Yennora, Everest Function Centre in Rockdale and Anu Kitchen in Campsie. Book two to four weeks ahead, and expect the weekends of 18 and 24 October 2026 to go first.",
          },
          {
            q: "Is Nepali goat curry halal?",
            a: "It depends on the kitchen. Most source goat from halal butchers, but very few advertise certification, so ring and ask before you order.",
          },
        ],
      },
      {
        type: "p",
        text: "Dashain is fifteen days long and only one of them is about the tika. The rest is goat, rice, cards and a house that never quite empties. Get your order in early, and eat like the fridge is about to be full.",
      },
    ],
  },
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
