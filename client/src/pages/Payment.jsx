import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCart } from "../features/cart/CartProvider";
import { useAuth } from "../app/AuthProvider";
import api from "../lib/api";

const CHECKOUT_KEY = "khaja_checkout";
const PENDING_KEY = "khaja_payment_pending";

const Payment = () => {
  const { cart, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [method, setMethod] = useState("COD");
  const [isVerifying, setIsVerifying] = useState(false);

  const walletQuery = useQuery({
    queryKey: ["wallet", "me"],
    queryFn: async () => (await api.get("/api/wallet/me")).data.data
  });

  const checkoutInfo = useMemo(() => {
    const stored = localStorage.getItem(CHECKOUT_KEY);
    return stored ? JSON.parse(stored) : null;
  }, []);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        vendorId: cart.vendorId,
        items: cart.items.map((i) => ({
          menuItemId: i.menuItemId,
          qty: i.qty,
          selectedVariant: i.selectedVariant,
          selectedAddons: i.selectedAddons,
          tastePreferences: i.tastePreferences
        })),
        paymentMethod: method,
        ...checkoutInfo
      };
      return (await api.post("/api/orders", payload)).data.data;
    },
    onSuccess: async (order) => {
      if (method === "COD" || method === "WALLET") {
        toast.success(method === "COD" ? "Order placed" : "Payment completed");
        clearCart();
        localStorage.removeItem(CHECKOUT_KEY);
        navigate("/orders");
        return;
      }

      localStorage.setItem(PENDING_KEY, JSON.stringify({ orderId: order._id, method }));
      if (method === "STRIPE") {
        const stripeSession = (await api.post("/api/payments/stripe/checkout", { orderId: order._id })).data.data;
        if (stripeSession?.url) {
          window.location.href = stripeSession.url;
          return;
        }
      }
      if (method === "KHALTI") {
        const khaltiSession = (await api.post("/api/payments/khalti/initiate", { orderId: order._id })).data.data;
        if (khaltiSession?.paymentUrl) {
          window.location.href = khaltiSession.paymentUrl;
          return;
        }
      }
      toast.error("Payment initiation failed");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Order failed");
    }
  });

  if (!user) {
    return <section className="mx-auto max-w-4xl px-4 py-10">Please login to pay.</section>;
  }

  const hasPending = Boolean(localStorage.getItem(PENDING_KEY));
  if ((!checkoutInfo || cart.items.length === 0) && !hasPending) {
    return <section className="mx-auto max-w-4xl px-4 py-10">Missing checkout info.</section>;
  }

  const total = subtotal;

  useEffect(() => {
    const status = params.get("status");
    const sessionId = params.get("session_id");
    const pidx = params.get("pidx");
    const stored = localStorage.getItem(PENDING_KEY);
    if (!status || !stored || isVerifying) return;
    const pending = JSON.parse(stored);
    if (!pending?.orderId || !pending?.method) return;

    const verify = async () => {
      setIsVerifying(true);
      try {
        if (status === "success" && pending.method === "STRIPE" && sessionId) {
          await api.post("/api/payments/stripe/confirm", { orderId: pending.orderId, sessionId });
          toast.success("Stripe payment verified");
        } else if (status === "success" && pending.method === "KHALTI" && pidx) {
          await api.post("/api/payments/khalti/verify", { orderId: pending.orderId, pidx });
          toast.success("Khalti payment verified");
        } else if (status === "cancel") {
          toast.error("Payment cancelled");
          return;
        }
        clearCart();
        localStorage.removeItem(CHECKOUT_KEY);
        localStorage.removeItem(PENDING_KEY);
        navigate("/orders");
      } catch (err) {
        toast.error(err.response?.data?.message || "Payment verification failed");
      } finally {
        setIsVerifying(false);
      }
    };

    verify();
  }, [params, clearCart, navigate, isVerifying]);

  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <div className="rounded-[32px] bg-white p-6 shadow-card">
        <h2 className="font-display text-2xl text-ink">Payment</h2>
        <p className="text-sm text-gray-500">Select a payment method</p>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          {["COD", "WALLET", "STRIPE", "KHALTI"].map((option) => (
            <button
              key={option}
              onClick={() => setMethod(option)}
              className={`rounded-2xl border px-4 py-3 text-xs font-semibold ${
                method === option
                  ? "border-primary-500 bg-primary-500 text-white"
                  : "border-orange-100 bg-white text-gray-600"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        {method === "WALLET" && (
          <div className="mt-3 rounded-2xl bg-emerald-50 px-4 py-2 text-xs text-emerald-700">
            Wallet balance: Rs {walletQuery.data?.balance ?? 0}
          </div>
        )}

        <div className="mt-6 rounded-3xl border border-orange-100 bg-orange-50/50 p-4">
          <p className="text-sm font-semibold text-ink">Delivery details</p>
          <p className="text-xs text-gray-500">{checkoutInfo.customerAddress}</p>
          <p className="text-xs text-gray-500">{checkoutInfo.customerCity}</p>
          <p className="text-xs text-gray-500">{checkoutInfo.customerPhone}</p>
        </div>

        <div className="mt-6 space-y-3">
          {cart.items.map((item) => (
            <div key={item.menuItemId} className="flex items-center justify-between text-sm">
              <span>{item.name} x{item.qty}</span>
              <span>Rs {item.price * item.qty}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-orange-100 pt-4 text-sm">
          <span className="text-gray-500">Total</span>
          <span className="text-lg font-semibold text-ink">Rs {total}</span>
        </div>

        <button
          onClick={() => mutation.mutate()}
          className="mt-6 w-full rounded-full bg-primary-500 px-6 py-3 text-sm font-semibold text-white"
          disabled={mutation.isPending || isVerifying}
        >
          {mutation.isPending || isVerifying
            ? "Processing..."
            : method === "COD" || method === "WALLET"
              ? "Confirm Order"
              : "Proceed to Pay"}
        </button>
      </div>
    </section>
  );
};

export default Payment;
