# NepaliEats — Website UI Kit

Interactive, click-through recreation of the NepaliEats consumer website.

## Screens
- **Home** (`Home.jsx`) — hero ("Find your momo people"), prayer-flag bunting, cuisine quick-filters, featured "hidden gems" grid, dark story strip.
- **Explore** (`Browse.jsx`) — sticky filter bar (venue type + cuisine chips), live-filtering results grid, result count.
- **Venue detail** (`VenueDetail.jsx`) — gradient hero, rating/price/location, cuisine tags, blurb, popular dishes, reviews with avatars, sticky action sidebar.

## Composition
- `Header.jsx` / `Footer.jsx` — shared chrome (logo lockup, search, prayer-flag footer band).
- `App.jsx` — simple route state (home / browse / detail).
- `data.js` — sample venue data (`window.NE_DATA`), demo only.

All screens compose design-system primitives from `window.DesignSystem_580998` (Button, Badge, Tag, Rating, Avatar, Input, PlaceCard). Icons are Phosphor (CDN). Open `index.html` to interact: explore → click any card → venue detail → back.
