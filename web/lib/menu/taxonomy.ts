// Controlled, hierarchical dish vocabulary — the seed for the `dish_categories`
// table and the single source of searchable dishes. The seeder maps each menu
// item to these slugs (never free text) and hard-errors on an unknown slug, so
// the vocab only ever grows by a deliberate edit here, never by silent
// auto-create. See MENU-PLAN.md.
//
// MODEL (locked):
//  - DISH is the default: every dish is a flat top-level tag (momo, curry, sekuwa...).
//  - MOMO also has a PREPARATION subtree (steamed/jhol/kothey/sandheko/chilli/fried).
//    Momo is the only dish people search by prep; other dishes can get prep children
//    later with zero migration.
//  - PROTEIN is a CROSS-CUTTING facet (chicken/goat/buff/veg...), NOT children of a
//    dish. Protein applies across nearly every savoury dish and sources model it
//    inconsistently (priced variants vs separate "Chicken X / Goat X" items), so it
//    is one flat facet tagged ALONGSIDE the dish: chicken momo -> [momo, chicken];
//    goat curry -> [curry, goat]. Search = dish (primary) + optional protein filter.
//
// `kind`:   dish | style | preparation (momo only) | protein (cross-cutting facet)
// `parent`: parent dish slug (momo preparation subtree only); absent = top-level
// `synonyms`: alternate printed names that canonicalize TO this slug at
//             transcription time (e.g. "kothey" -> fried-momo). They never create
//             new rows — they collapse spelling/naming variants onto the canonical.
// `featured`: surface on landing / hub pages (drives is_featured).

export type DishKind = "dish" | "style" | "preparation" | "protein";

export interface DishCategory {
  slug: string;
  name: string;
  kind: DishKind;
  parent?: string; // parent slug (momo subtree only)
  synonyms?: string[]; // printed variants that resolve to this slug
  featured?: boolean; // headline dish — stands alone as a restaurant tag
  style?: string; // cuisine this dish belongs to (style slug); the seeder adds this
  //                 style tag wherever the dish appears, so the dish rolls up to its
  //                 cuisine instead of being its own restaurant tag (thukpa -> tibetan).
}

export const DISH_CATEGORIES: DishCategory[] = [
  // --- Dishes (flat, top-level) ---------------------------------------------
  { slug: "momo", kind: "dish", name: "Momo", synonyms: ["momos", "dumpling", "dumplings", "mo:mo"], featured: true },
  { slug: "chowmein", kind: "dish", name: "Chow mein", synonyms: ["chow mein", "chowmin", "chow min", "noodles"] },
  { slug: "thukpa", kind: "dish", name: "Thukpa", synonyms: ["thukpa noodle soup"], style: "tibetan" },
  { slug: "sekuwa", kind: "dish", name: "Sekuwa", synonyms: ["sekuwa bbq", "grill"], featured: true },
  { slug: "sukuti", kind: "dish", name: "Sukuti", synonyms: ["sukuti sandeko"], style: "newari" },
  { slug: "chatamari", kind: "dish", name: "Chatamari", synonyms: ["newari pizza", "chatamari pizza"], style: "newari" },
  { slug: "bara", kind: "dish", name: "Bara", synonyms: ["wo", "woh", "bara newari"], style: "newari" },
  { slug: "sel-roti", kind: "dish", name: "Sel roti", synonyms: ["selroti", "sel"] },
  { slug: "dal-bhat", kind: "dish", name: "Dal bhat", synonyms: ["daal bhat", "dal bhat tarkari", "khana set"], featured: true },
  { slug: "thali", kind: "dish", name: "Thali / set", synonyms: ["thali set", "set menu", "platter"] },
  { slug: "curry", kind: "dish", name: "Curry", synonyms: ["curries", "tarkari"] },
  { slug: "biryani", kind: "dish", name: "Biryani", synonyms: ["biriyani", "briyani"] },
  { slug: "fried-rice", kind: "dish", name: "Fried rice", synonyms: ["friedrice"] },
  { slug: "samosa", kind: "dish", name: "Samosa", synonyms: ["singara", "samocha"] },
  { slug: "pakora", kind: "dish", name: "Pakora", synonyms: ["pakoda", "bhaji", "fritter"] },
  { slug: "choila", kind: "dish", name: "Choila", synonyms: ["chhoila", "choyla", "chwela"], style: "newari" },
  { slug: "sandheko", kind: "dish", name: "Sandheko", synonyms: ["sadeko", "sandeko", "aloo sandheko", "bhatmas sandheko", "wai wai sandheko"] },
  { slug: "chaat", kind: "dish", name: "Chaat", synonyms: ["chat", "chatpate", "chatpati", "samosa chat", "papdi chaat"] },
  // Indo-Chinese "chilli" dishes (Chicken Chilli, Paneer Chilli, Chilli Chips) —
  // protein/veg fried then tossed in a chilli/capsicum sauce. Distinct from
  // chilli-momo (which stays under the momo subtree).
  { slug: "chilli", kind: "dish", name: "Chilli", synonyms: ["chili", "chilly", "chilli chicken", "chicken chilli", "paneer chilli", "chilli chips"] },
  { slug: "soup", kind: "dish", name: "Soup" },
  { slug: "taas", kind: "dish", name: "Taas", synonyms: ["tas", "thakali taas"], style: "thakali" },
  { slug: "seekh-kebab", kind: "dish", name: "Seekh Kebab", synonyms: ["seekh kabab", "sheek kebab", "kebab"] },
  { slug: "tikka", kind: "dish", name: "Tikka", synonyms: ["chicken tikka", "tikka sizzler"] },
  { slug: "tandoori", kind: "dish", name: "Tandoori", synonyms: ["tandoor", "tandoori sizzler"] },
  { slug: "sizzler", kind: "dish", name: "Sizzler", synonyms: ["sizzling"] },
  { slug: "butter-chicken", kind: "dish", name: "Butter Chicken", synonyms: ["butter chk"] },
  { slug: "naan", kind: "dish", name: "Naan", synonyms: ["garlic naan", "cheese naan", "butter naan"] },
  { slug: "roti", kind: "dish", name: "Roti", synonyms: ["chapati", "tandoori roti"] },
  { slug: "pani-puri", kind: "dish", name: "Pani Puri", synonyms: ["golgappa", "gol gappa", "puchka", "panipuri"], style: "nepali-indian" },
  { slug: "laphing", kind: "dish", name: "Laphing", synonyms: ["laping", "lhaping", "laphing dry", "laphing jhol"], style: "tibetan" },
  { slug: "khaja", kind: "dish", name: "Khaja Set", synonyms: ["khaja", "newari khaja", "khaja set", "samay baji"] },
  { slug: "bhutan", kind: "dish", name: "Bhutan", synonyms: ["bhutuwa", "bhuttan", "goat bhutan"] },
  { slug: "sausage", kind: "dish", name: "Sausage", synonyms: ["masala sausage", "chicken sausage"] },
  { slug: "shavale", kind: "dish", name: "Shavale", synonyms: ["shapale", "sha phaley", "shyabhale", "shabhale"], style: "tibetan" },
  { slug: "keema-noodle", kind: "dish", name: "Keema Noodle", synonyms: ["keema", "kheema noodle"] },
  { slug: "yomari", kind: "dish", name: "Yomari", synonyms: ["yamari", "yomari punhi"], style: "newari" },
  { slug: "lollipop", kind: "dish", name: "Lollipop", synonyms: ["chicken lollipop", "lolipop", "drums of heaven", "chilli lollipop"] },
  { slug: "wings", kind: "dish", name: "Wings", synonyms: ["chicken wings", "buffalo wings", "jumbo wings", "wings chilli", "chilli wings"] },
  // timur (Sichuan pepper) is a flavour that defines many dishes (timur chicken, timur
  // wings, timur chutney); kept as a searchable dish-level tag since people search "timur".
  { slug: "timur", kind: "dish", name: "Timur", synonyms: ["timmur", "timmuri", "timbur", "sichuan pepper", "szechuan pepper"] },
  { slug: "dessert", kind: "dish", name: "Dessert", synonyms: ["sweets", "mithai", "juju dhau"] },
  { slug: "drinks", kind: "dish", name: "Drinks", synonyms: ["beverages", "chiya", "lassi"] },

  // --- Styles (flat, top-level) ---------------------------------------------
  { slug: "newari", kind: "style", name: "Newari", synonyms: ["newa", "newar"] },
  { slug: "thakali", kind: "style", name: "Thakali", synonyms: ["thakali set"] },
  { slug: "tibetan", kind: "style", name: "Tibetan", synonyms: ["tibet"] },
  { slug: "nepali-indian", kind: "style", name: "Nepali-Indian", synonyms: ["indian-nepali", "indo-nepali", "indian nepalese"] },

  // --- Momo preparation subtree (momo-specific prep styles) -----------------
  // Preparation (from the item name). NOTE: fried and kothey are DISTINCT — real
  // menus list "Fried" (deep fried) and "Kothey" (slightly pan-fried) as separate
  // priced lines, so they are separate tags, not synonyms.
  { slug: "steamed-momo", kind: "preparation", parent: "momo", name: "Steamed Momo", synonyms: ["steam momo", "steamed", "steam"] },
  { slug: "fried-momo", kind: "preparation", parent: "momo", name: "Fried Momo", synonyms: ["fry momo", "deep fried momo", "deep-fried momo"] },
  { slug: "kothey-momo", kind: "preparation", parent: "momo", name: "Kothey Momo", synonyms: ["kothey", "kothe", "pan fried momo", "pan-fried momo"] },
  { slug: "sandheko-momo", kind: "preparation", parent: "momo", name: "Sandheko Momo", synonyms: ["sandheko", "sadeko", "sandeko momo"] },
  { slug: "jhol-momo", kind: "preparation", parent: "momo", name: "Jhol Momo", synonyms: ["jhol", "jhol momo", "soup momo"] },
  { slug: "chilli-momo", kind: "preparation", parent: "momo", name: "Chilli Momo (C-Momo)", synonyms: ["c-momo", "c momo", "chili momo", "chilly momo"] },
  // (protein is NOT a momo child — see the cross-cutting protein facet below)

  // --- Protein: cross-cutting facet (NOT children of any dish) ---------------
  // Tagged ALONGSIDE the dish. The seeder derives protein from the variant label
  // AND the item name/description (e.g. "Kukhura Ko Masu" -> chicken). Aliases
  // bridge English/Nepali search ("chicken", "kukhura", "khasi" -> goat). "mutton"
  // = GOAT in Nepali restaurant usage, distinct from lamb (bheda/sheep).
  { slug: "chicken", kind: "protein", name: "Chicken", synonyms: ["kukhura", "kukhura ko masu"] },
  { slug: "veg", kind: "protein", name: "Veg", synonyms: ["vegetable", "vegetarian"] },
  { slug: "egg", kind: "protein", name: "Egg", synonyms: ["anda", "phul"] },
  { slug: "lamb", kind: "protein", name: "Lamb", synonyms: ["bheda", "bheda ko masu", "sheep"] },
  { slug: "goat", kind: "protein", name: "Goat", synonyms: ["mutton", "khasi", "khasi ko masu"] },
  { slug: "buff", kind: "protein", name: "Buff", synonyms: ["buffalo", "rango", "rango ko masu"] },
  { slug: "beef", kind: "protein", name: "Beef", synonyms: ["cow"] },
  { slug: "pork", kind: "protein", name: "Pork", synonyms: ["bangur", "sungur"] },
  { slug: "fish", kind: "protein", name: "Fish", synonyms: ["machha"] },
  { slug: "prawn", kind: "protein", name: "Prawn", synonyms: ["shrimp", "jhinge", "king prawn"] },
  { slug: "paneer", kind: "protein", name: "Paneer", synonyms: ["cottage cheese"] },
];

export const CATEGORY_SLUGS = DISH_CATEGORIES.map((c) => c.slug);

// Coarse (dish + style) slugs only — what rolls up into restaurants.tags. The
// momo subtree (preparation/protein) lives only at the item level, never on the
// restaurant rollup ("/tag/steamed-momo" would be meaningless).
export const COARSE_SLUGS = DISH_CATEGORIES
  .filter((c) => c.kind === "dish" || c.kind === "style")
  .map((c) => c.slug);
