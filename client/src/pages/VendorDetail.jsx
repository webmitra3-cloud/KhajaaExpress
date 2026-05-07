import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "../lib/api";
import FoodCard from "../components/FoodCard";
import SectionHeading from "../components/SectionHeading";
import EmptyState from "../components/EmptyState";
import { useCart } from "../features/cart/CartProvider";

const VendorDetail = () => {
  const { slug } = useParams();
  const { addItem } = useCart();
  const [tab, setTab] = useState("menu");

  const [search, setSearch] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const [vegFilter, setVegFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["vendor", slug],
    queryFn: async () => (await api.get(`/api/vendors/public/${slug}`)).data.data
  });

  const vendor = data?.vendor;
  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["items", slug, search, vegOnly],
    enabled: !!vendor?._id,
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("vendorSlug", slug);
      if (search) params.append("search", search);
      if (vegOnly) params.append("isVeg", "true");
      return (await api.get(`/api/items/public?${params.toString()}`)).data.data;
    }
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", vendor?._id],
    enabled: !!vendor?._id,
    queryFn: async () => (await api.get(`/api/reviews/vendor/${vendor._id}`)).data.data
  });

  const handleAdd = (item) => {
    addItem({
      menuItemId: item._id,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl,
      vendorId: vendor._id,
      selectedVariant: item.selectedVariant,
      selectedAddons: item.selectedAddons
    });
    toast.success("Added to cart");
  };

  if (isLoading) {
    return <section className="mx-auto max-w-6xl px-4 py-10">Loading...</section>;
  }

  if (!vendor) {
    return <section className="mx-auto max-w-6xl px-4 py-10">Restaurant not found.</section>;
  }

  return (
    <section className="bg-slate-50">
      <div className="bg-gradient-to-br from-orange-50 via-amber-50/40 to-white">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="relative overflow-hidden rounded-3xl">
            <img
              src={vendor.coverImageUrl || "https://images.unsplash.com/photo-1504674900247-0877df9cc836"}
              alt={vendor.restaurantName}
              className="h-44 w-full object-cover md:h-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="font-display text-3xl text-white md:text-4xl">{vendor.restaurantName}</h1>
                <p className="mt-1 text-sm text-orange-50">{vendor.cuisineTags?.join(", ") || vendor.description}</p>
                <p className="mt-1 text-xs text-orange-100">{vendor.city}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-gray-700">
                  Min Rs {vendor.minOrder}
                </span>
                <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-gray-700">
                  Delivery Rs {vendor.deliveryFee}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    vendor.isOpenManualOverride ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                  }`}
                >
                  {vendor.isOpenManualOverride ? "Open now" : "Closed"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-12">
        <div className="sticky top-[72px] z-30 -mt-6 rounded-2xl border border-orange-100/60 bg-white px-4 py-3 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {["menu", "info", "reviews"].map((name) => (
              <button
                key={name}
                onClick={() => setTab(name)}
                className={`rounded-full px-4 py-2 text-xs font-semibold ${
                  tab === name
                    ? "border-b-2 border-primary-500 text-primary-600"
                    : "text-gray-600 hover:text-primary-600"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {tab === "menu" && (
          <div className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <SectionHeading title="Menu" subtitle="Freshly prepared for you." />
              <div className="flex flex-wrap gap-3">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search items"
                  className="h-10 rounded-2xl border border-orange-100 px-4 text-xs"
                />
                <input
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  placeholder="Category"
                  className="h-10 rounded-2xl border border-orange-100 px-4 text-xs"
                />
                <select
                  value={vegFilter}
                  onChange={(e) => {
                    const next = e.target.value;
                    setVegFilter(next);
                    setVegOnly(next === "VEG");
                  }}
                  className="h-10 rounded-2xl border border-orange-100 px-3 text-xs text-gray-600"
                >
                  <option value="ALL">All</option>
                  <option value="VEG">Veg</option>
                  <option value="NON_VEG">Non-veg</option>
                </select>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {itemsLoading && Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex gap-4">
                    <div className="h-20 w-20 rounded-xl bg-slate-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-2/3 rounded bg-slate-100" />
                      <div className="h-3 w-full rounded bg-slate-100" />
                      <div className="h-3 w-1/2 rounded bg-slate-100" />
                    </div>
                    <div className="h-10 w-10 rounded-full bg-slate-100" />
                  </div>
                </div>
              ))}
              {!itemsLoading &&
                items.filter((item) => {
                  const categoryValue = `${item.categoryName || item.category || item.categoryId || ""}`.toLowerCase();
                  const matchesCategory = categoryFilter
                    ? categoryValue.includes(categoryFilter.toLowerCase())
                    : true;
                  const matchesVeg = vegFilter === "NON_VEG" ? item.isVeg === false : true;
                  return matchesCategory && matchesVeg;
                }).length === 0 && (
                <div className="md:col-span-2">
                  <EmptyState title="No items match your search" subtitle="Try adjusting filters or search keywords." />
                </div>
              )}
              {items
                .filter((item) => {
                  const categoryValue = `${item.categoryName || item.category || item.categoryId || ""}`.toLowerCase();
                  const matchesCategory = categoryFilter
                    ? categoryValue.includes(categoryFilter.toLowerCase())
                    : true;
                  const matchesVeg = vegFilter === "NON_VEG" ? item.isVeg === false : true;
                  return matchesCategory && matchesVeg;
                })
                .map((item) => (
                <FoodCard key={item._id} item={item} onAdd={handleAdd} />
              ))}
            </div>
          </div>
        )}

        {tab === "info" && (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {[
              { label: "Address", value: vendor.address },
              { label: "City", value: vendor.city },
              { label: "Opening hours", value: vendor.openingHours },
              { label: "Delivery fee", value: `Rs ${vendor.deliveryFee}` },
              { label: "Min order", value: `Rs ${vendor.minOrder}` },
              { label: "Cuisines", value: vendor.cuisineTags?.join(", ") || "-" }
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase text-slate-400">{item.label}</p>
                <p className="mt-2 text-sm font-semibold text-ink">{item.value}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "reviews" && (
          <div className="mt-8">
            {reviews.length === 0 ? (
              <EmptyState title="No reviews yet" subtitle="Be the first to share your experience." />
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Average rating</p>
                  <p className="mt-2 text-2xl font-semibold text-ink">
                    {(reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)} / 5
                  </p>
                </div>
                {reviews.map((review) => {
                  const reviewerName = review.customerName || review.customerId?.name || "Customer";
                  return (
                  <div key={review._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-orange-100 text-sm font-semibold text-orange-700">
                        {reviewerName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ink">{reviewerName}</p>
                        <p className="text-xs text-slate-500">{review.rating} / 5</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">{review.comment || "Great taste!"}</p>
                    <p className="mt-2 text-xs text-slate-400">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )})}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default VendorDetail;
