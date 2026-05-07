import { Plus, Clock } from "lucide-react";
import { useState } from "react";

const FoodCard = ({ item, onAdd }) => {
  const [variant, setVariant] = useState(item.variants?.[0] || null);
  const [addons, setAddons] = useState([]);
  const variantDelta = variant?.priceDelta || 0;
  const addonsTotal = addons.reduce((sum, addon) => sum + (addon.price || 0), 0);
  const computedPrice = item.price + variantDelta + addonsTotal;

  const toggleAddon = (addon) => {
    setAddons((prev) => {
      const exists = prev.find((a) => a.name === addon.name);
      if (exists) {
        return prev.filter((a) => a.name !== addon.name);
      }
      return [...prev, addon];
    });
  };

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-transform duration-300 hover:-translate-y-1">
      <div className="flex gap-4">
        <div className="relative h-20 w-20 overflow-hidden rounded-xl">
          <img
            src={item.imageUrl || "https://images.unsplash.com/photo-1504674900247-0877df9cc836"}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-ink">{item.name}</p>
              <p className="mt-1 text-xs text-gray-500 line-clamp-2">{item.description}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                <span className="flex items-center gap-1 rounded-full bg-orange-50 px-2 py-1 text-orange-600">
                  <Clock className="h-3 w-3" /> {item.prepTimeMins || 20} mins
                </span>
                {item.isVeg && (
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-600">Veg</span>
                )}
              </div>
            </div>
            <button
              onClick={() =>
                onAdd({
                  ...item,
                  price: computedPrice,
                  selectedVariant: variant,
                  selectedAddons: addons
                })
              }
              title="Add to cart"
              className="grid h-9 w-9 place-items-center rounded-full bg-primary-500 text-white shadow-glow"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-600">Rs {computedPrice}</span>
            {item.variants?.length > 0 && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">Variants</span>
            )}
          </div>
          {item.variants?.length > 0 && (
            <select
              value={variant?.name || ""}
              onChange={(e) => {
                const found = item.variants.find((v) => v.name === e.target.value);
                setVariant(found || null);
              }}
              className="mt-3 w-full rounded-2xl border border-orange-100 px-3 py-2 text-xs"
            >
              {item.variants.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} (+Rs {v.priceDelta})
                </option>
              ))}
            </select>
          )}
          {item.addons?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {item.addons.map((addon) => (
                <button
                  key={addon.name}
                  onClick={() => toggleAddon(addon)}
                  className={`rounded-full border px-3 py-1 text-[10px] ${
                    addons.find((a) => a.name === addon.name)
                      ? "border-primary-500 bg-primary-500 text-white"
                      : "border-orange-100 text-gray-600"
                  }`}
                >
                  {addon.name} (+Rs {addon.price})
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FoodCard;
