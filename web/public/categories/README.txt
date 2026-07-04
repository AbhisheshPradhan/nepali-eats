Category images for the homepage "Eat by craving" carousel, the /nepali-food hub
cards, and the dish/cuisine landing-page heroes. All resolved by foodImage() in
web/lib/food.ts, which derives paths from the FAMILIES hierarchy there.

Layout — one folder per category (momo, newari, thakali, tibetan, grill,
nepali-indian, vegetarian):

  categories/<category>/cover.jpg      <- the category hero
  categories/<category>/<dish-slug>.jpg <- a dish (filename == registry slug)

  e.g. categories/momo/cover.jpg
       categories/momo/steamed-momo.jpg
       categories/newari/choila.jpg

Rules:
- Filename must equal the slug in web/lib/food.ts (cover for the hero).
- Extensions tried in order: jpg, jpeg, webp, png.
- 4:3 landscape, >=1200x900, center-cropped (object-cover). One 4:3 master works
  everywhere; the one 16:10 slot (hub dish cards) center-crops a 4:3 fine.
- Missing file -> the tile/hero self-hides (gradient fallback), no error.

Have covers: momo, newari, tibetan, vegetarian. Still needed: everything else
(thakali/grill/nepali-indian covers + all dish files).
