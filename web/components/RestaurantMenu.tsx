import type { MenuCategory } from "@/lib/types";

const fmtPrice = (price: number | null, currency = "AUD"): string =>
  price == null
    ? ""
    : new Intl.NumberFormat("en-AU", { style: "currency", currency }).format(price);

// Standard veg symbol (green dot in a green square). Shown only on veg items that
// sit in a MIXED section — redundant when a whole section is vegetarian.
function VegDot() {
  return (
    <span
      role="img"
      aria-label="Vegetarian"
      title="Vegetarian"
      className="inline-flex items-center justify-center align-middle ml-1.5 w-3 h-3 rounded-[3px] border border-coriander-600 -translate-y-px"
    >
      <span className="w-1 h-1 rounded-full bg-coriander-600" />
    </span>
  );
}

// Detail-page menu render. Sections -> items -> variant prices. Single-price items
// show the price inline; multi-variant items list the priced options below.
export function RestaurantMenu({ menu }: { menu: MenuCategory[] }) {
  if (!menu.length) return null;
  return (
    <section className="mb-8">
      <h2 className="font-display font-extrabold text-[1.5rem] mb-4 text-balance">The menu</h2>
      <div className="space-y-8">
        {menu.map((cat) => {
          const allVeg = cat.items.every((i) => i.isVegetarian === true);
          return (
            <div key={cat.id}>
              <h3 className="font-display font-bold text-[1.15rem] tracking-tight text-chili-700 mb-2.5 text-balance">
                {cat.name}
              </h3>
              <ul className="list-none m-0 p-0 bg-white rounded-lg shadow-sm divide-y divide-paper-200">
                {cat.items.map((item) => {
                  const priced = item.variants.filter((v) => v.price != null);
                  const single = priced.length <= 1;
                  const currency = item.variants[0]?.currency ?? "AUD";
                  return (
                    <li key={item.id} className="p-4">
                      <div className="flex gap-3 items-baseline">
                        <span className="font-display font-bold text-ink-900 flex-1 min-w-0">
                          {item.name}
                          {item.isVegetarian === true && !allVeg ? <VegDot /> : null}
                        </span>
                        {single && priced[0] ? (
                          <span className="shrink-0 font-body font-semibold text-ink-900 tabular-nums whitespace-nowrap">
                            {fmtPrice(priced[0].price, currency)}
                          </span>
                        ) : null}
                      </div>
                      {item.description ? (
                        <p className="text-ink-500 text-[0.9rem] leading-snug m-0 mt-1">
                          {item.description}
                        </p>
                      ) : null}
                      {!single ? (
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.85rem] text-ink-500">
                          {priced.map((v, i) => (
                            <span key={i} className="whitespace-nowrap">
                              {v.label ? `${v.label} ` : ""}
                              <span className="font-semibold text-ink-900 tabular-nums">
                                {fmtPrice(v.price, currency)}
                              </span>
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
