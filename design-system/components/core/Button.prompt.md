Chunky, friendly pill button — use for any primary action ("Add a spot", "Get directions", "Save").

```jsx
<Button variant="primary" size="md">Add a spot</Button>
<Button variant="outline" iconLeft={<i className="ph ph-map-pin" />}>Get directions</Button>
```

Variants: `primary` (chili red, the default CTA), `secondary` (marigold, lighter weight actions), `outline`, `ghost`. Sizes `sm | md | lg`. Set `pill={false}` for a softer md-radius rectangle. Hover lifts a warm chili glow; press shrinks slightly.
