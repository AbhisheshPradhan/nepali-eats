The signature NepaliEats listing card — a venue's photo, name, rating, cuisines and quick facts. Lifts on hover.

```jsx
<PlaceCard
  name="Himalayan Momo House"
  venueType="Restaurant"
  cuisines={['Momo', 'Newari', 'Thakali']}
  rating={4.7}
  reviewCount={212}
  suburb="Rooty Hill, NSW"
  distance="1.2 km"
  priceLevel={2}
  isOpen
  favourite
  onClick={() => {}}
/>
```

Pass an `image` URL for a real photo; otherwise a warm gradient + venue icon shows. Width is controlled by the parent grid (≈360–400px ideal). Composes `Badge`, `Tag`, `Rating`. Uses Phosphor icon classes (`ph`, `ph-fill`).
