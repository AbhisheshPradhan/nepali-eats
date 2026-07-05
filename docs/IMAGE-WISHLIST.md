# Food image wishlist

**Aspect ratio: 4:3 landscape. Minimum 1200x900px. jpg or webp.**

Every file goes in `web/public/categories/<category>/` and the filename must
match exactly (it equals the slug in `web/lib/food.ts`). Drop the file in and
the tile/hero appears on the next render, no code change. Missing files
self-hide, so ship these in any order.

**What makes a good shot (applies to all of them):**

- Real photos of real plates. No AI renders, no watermarked stock.
- Natural light, shot from above or at about 45 degrees, food filling the
  frame. Phone photos are fine if the light is good.
- Steam is gold. A blurred hand, a torn momo, a dipped spoon all help. A
  sterile studio plate on white does not.
- The image gets centre-cropped in some slots, so keep the hero of the shot
  (the food) in the middle of the frame.
- If the photo is a restaurant's, get their OK and note the credit so we can
  attribute it.

## Priority 1: category covers (unlock homepage carousel tiles + landing heroes)

| File                      | The shot I want                                                                                                                                                                                                        |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `thakali/cover.jpg`       | A full Thakali dal bhat set from above: the plate ringed with small bowls, black dal front and centre, gundruk and pickles visible, rice still steaming. The whole spread in one frame, it should look like abundance. |
| `grill/cover.jpg`         | Sekuwa skewers over the coals, char on the edges, ideally a little smoke. Fire in frame beats plated here.                                                                                                             |
| `nepali-indian/cover.jpg` | One table, both menus: a plate of momo beside a curry and naan or biryani. The point of the category in a single frame.                                                                                                |

## Priority 2: momo dish shots (heroes for the /nepali-food momo pages)

| File                     | The shot I want                                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `momo/steamed-momo.jpg`  | A fresh steamed plate, skins glossy and slightly translucent, the achaar bowl in frame. One momo lifted or dipped if possible. |
| `momo/jhol-momo.jpg`     | Momo half-sunk in the sesame-tomato jhol, a spoon in the bowl. The soup should look drinkable, not like a garnish.             |
| `momo/chilli-momo.jpg`   | C-momo glazed deep red and glossy, onion and capsicum in the toss. Shine is everything here.                                   |
| `momo/fried-momo.jpg`    | Golden and blistered, one broken open so the juicy filling shows against the crisp shell.                                      |
| `momo/kothey-momo.jpg`   | Crisp base facing the camera, soft steamed top visible. The two-texture contrast is the shot.                                  |
| `momo/sandheko-momo.jpg` | Momo tossed and coated in the red dressing, coriander and raw onion through it, a little oil sheen.                            |

## Priority 3: the other dish heroes

| File                   | The shot I want                                                                                                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `newari/choila.jpg`    | Smoky choila piled dark and glistening, chiura (beaten rice) beside it. Should look fierce, not tidy.                                                            |
| `thakali/dal-bhat.jpg` | A closer, simpler frame than the Thakali cover: dal pouring or poured over rice, a curry and pickle at the edge. Everyday comfort rather than the full ceremony. |
| `grill/sekuwa.jpg`     | Plated skewers, charred edges and raw onion, lemon wedge. Different from the cover: this one is on the table, not on the fire.                                   |
| `tibetan/thukpa.jpg`   | A steaming bowl, noodles mid-lift on a fork or chopsticks, broth and veg visible. Cold-day food.                                                                 |

## Already covered (no action)

Covers for momo, newari, tibetan and vegetarian are in. The kwati story has
both its photos. Extra gallery shots per dish are a nice-to-have later
(`FOOD_GALLERIES` in `web/lib/food.ts` is wired but empty).
