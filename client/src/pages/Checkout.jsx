import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, ChevronDown, MapPin, NotebookText, CreditCard, Home } from "lucide-react";
import { useCart } from "../features/cart/CartProvider";
import { useAuth } from "../app/AuthProvider";
import api from "../lib/api";

const schema = z.object({
  customerAddress: z.string().min(3),
  customerCity: z.string().min(2),
  customerLandmark: z.string().optional(),
  customerPhone: z.string().min(7),
  notes: z.string().optional(),
  lat: z.string().optional(),
  lng: z.string().optional(),
  couponCode: z.string().optional(),
  scheduledFor: z.string().optional()
});

const CHECKOUT_KEY = "khaja_checkout";

const Checkout = () => {
  const { cart, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [showLocation, setShowLocation] = useState(false);

  const { register, handleSubmit, formState, setError } = useForm({
    resolver: zodResolver(schema)
  });

  const placeOrderMutation = useMutation({
    mutationFn: async (payload) => (await api.post("/api/orders", payload)).data.data,
    onSuccess: () => {
      toast.success("Order placed");
      clearCart();
      navigate("/orders");
    },
    onError: (err) => {
      const message = err.response?.data?.message || "Order failed";
      const fieldErrors = err.response?.data?.errors?.fieldErrors;
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([key, messages]) => {
          if (messages?.length) {
            setError(key, { type: "server", message: messages[0] });
          }
        });
        const firstError = Object.values(fieldErrors).flat()?.[0];
        toast.error(firstError || message);
        return;
      }
      toast.error(message);
    }
  });

  if (!user) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-10">Please login to checkout.</section>
    );
  }

  if (cart.items.length === 0) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-10">Cart is empty.</section>
    );
  }

  const onSubmit = (values) => {
    if (!cart.vendorId) {
      toast.error("Please add items from a restaurant before checkout.");
      return;
    }
    const orderItems = cart.items
      .filter((item) => item && item.menuItemId)
      .map((i) => ({
        menuItemId: i.menuItemId,
        qty: i.qty,
        ...(i.selectedVariant ? { selectedVariant: i.selectedVariant } : {}),
        ...(Array.isArray(i.selectedAddons) ? { selectedAddons: i.selectedAddons } : {}),
        ...(i.tastePreferences ? { tastePreferences: i.tastePreferences } : {})
      }));
    if (orderItems.length === 0) {
      toast.error("Your cart items are invalid. Please re-add items.");
      return;
    }
    const payload = {
      customerAddress: values.customerAddress,
      customerCity: values.customerCity,
      customerLandmark: values.customerLandmark || "",
      customerPhone: values.customerPhone,
      notes: values.notes || "",
      ...(values.couponCode ? { couponCode: values.couponCode } : {}),
      ...(values.scheduledFor ? { scheduledFor: values.scheduledFor } : {}),
      ...(values.lat || values.lng
        ? {
            customerLocation: {
              lat: values.lat ? Number(values.lat) : undefined,
              lng: values.lng ? Number(values.lng) : undefined
            }
          }
        : {})
    };

    if (paymentMethod === "COD" || paymentMethod === "WALLET") {
      placeOrderMutation.mutate({
        vendorId: cart.vendorId,
        paymentMethod,
        items: orderItems,
        ...payload
      });
      return;
    }

    localStorage.setItem(CHECKOUT_KEY, JSON.stringify(payload));
    navigate("/payment");
  };

  return (
    <section className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6">
          <h2 className="font-display text-2xl text-ink">Checkout</h2>
          <p className="text-sm text-gray-500">Complete delivery details and choose payment.</p>
        </div>

        <form className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Home className="h-4 w-4 text-orange-500" />
                Delivery Address
              </div>
              <div className="mt-4 space-y-3">
                <label className="text-xs font-semibold text-gray-500">Street address</label>
                <input
                  {...register("customerAddress")}
                  placeholder="Street address"
                  className="h-11 w-full rounded-xl border border-orange-100 px-4 text-sm"
                />
                {formState.errors.customerAddress && (
                  <p className="text-xs text-red-500">{formState.errors.customerAddress.message}</p>
                )}
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-gray-500">City</label>
                    <input
                      {...register("customerCity")}
                      placeholder="City"
                      className="mt-2 h-11 w-full rounded-xl border border-orange-100 px-4 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500">Landmark (optional)</label>
                    <input
                      {...register("customerLandmark")}
                      placeholder="Landmark"
                      className="mt-2 h-11 w-full rounded-xl border border-orange-100 px-4 text-sm"
                    />
                  </div>
                </div>
                {formState.errors.customerCity && (
                  <p className="text-xs text-red-500">{formState.errors.customerCity.message}</p>
                )}
                <label className="text-xs font-semibold text-gray-500">Phone</label>
                <input
                  {...register("customerPhone")}
                  placeholder="Phone"
                  className="h-11 w-full rounded-xl border border-orange-100 px-4 text-sm"
                />
                {formState.errors.customerPhone && (
                  <p className="text-xs text-red-500">{formState.errors.customerPhone.message}</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <button
                type="button"
                onClick={() => setShowLocation((prev) => !prev)}
                className="flex w-full items-center justify-between text-sm font-semibold text-ink"
              >
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-orange-500" />
                  Pin Location (optional)
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showLocation ? "rotate-180" : ""}`} />
              </button>
              <p className="mt-1 text-xs text-gray-500">Add latitude/longitude for accurate delivery.</p>
              {showLocation && (
                <div className="mt-4 space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      {...register("lat")}
                      placeholder="Latitude (optional)"
                      className="h-11 rounded-xl border border-orange-100 px-4 text-sm"
                    />
                    <input
                      {...register("lng")}
                      placeholder="Longitude (optional)"
                      className="h-11 rounded-xl border border-orange-100 px-4 text-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Map integration can be added later.</p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <NotebookText className="h-4 w-4 text-orange-500" />
                Delivery Notes (optional)
              </div>
              <textarea
                {...register("notes")}
                placeholder="e.g., call when arriving, don’t ring bell"
                className="mt-3 w-full rounded-xl border border-orange-100 px-4 py-3 text-sm"
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">Coupon</div>
              <div className="mt-3 flex flex-wrap gap-3">
                <input
                  {...register("couponCode")}
                  placeholder="Coupon code"
                  className="h-11 flex-1 rounded-xl border border-orange-100 px-4 text-sm"
                />
                <button
                  type="button"
                  className="h-11 rounded-xl border border-orange-200 px-4 text-xs font-semibold text-orange-700"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <CreditCard className="h-4 w-4 text-orange-500" />
              Order Summary
            </div>
            <div className="mt-4 space-y-3 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>Rs {subtotal}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Payment</span>
                <span className="rounded-full bg-orange-50 px-3 py-1 text-[11px] font-semibold text-orange-600">
                  Select on the right
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-base font-semibold text-ink">
                <span>Total</span>
                <span>Rs {subtotal}</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <p className="text-xs font-semibold text-gray-500">Payment method</p>
              {["COD", "WALLET", "STRIPE", "KHALTI"].map((option) => {
                const isSelected = paymentMethod === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setPaymentMethod(option)}
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold ${
                      isSelected
                        ? "border-primary-500 bg-orange-50 text-primary-600"
                        : "border-slate-200 text-gray-600"
                    }`}
                  >
                    <span>{option}</span>
                    {isSelected && <CheckCircle2 className="h-4 w-4 text-primary-500" />}
                  </button>
                );
              })}
            </div>

            <button
              type="submit"
              className="mt-6 w-full rounded-full bg-primary-500 px-6 py-3 text-sm font-semibold text-white"
              disabled={placeOrderMutation.isPending}
            >
              {paymentMethod === "COD" || paymentMethod === "WALLET" ? "Place Order" : "Continue to Payment"}
            </button>
            <p className="mt-3 text-center text-xs text-gray-400">By placing order you agree to terms.</p>
          </aside>
        </form>
      </div>
    </section>
  );
};

export default Checkout;
