import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Mail, MapPin, User, Wallet, LifeBuoy, Settings } from "lucide-react";
import api from "../lib/api";
import SectionHeading from "../components/SectionHeading";
import { useAuth } from "../app/AuthProvider";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7)
});

const Account = () => {
  const { setUser, user } = useAuth();
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [addressForm, setAddressForm] = useState({ label: "Home", fullAddress: "", city: "", landmark: "" });
  const [ticketForm, setTicketForm] = useState({ category: "Delivery", message: "" });

  const profileQuery = useQuery({
    queryKey: ["profile", "me"],
    queryFn: async () => (await api.get("/api/users/me")).data.data
  });

  const addressQuery = useQuery({
    queryKey: ["addresses"],
    queryFn: async () => (await api.get("/api/addresses")).data.data
  });

  const ticketQuery = useQuery({
    queryKey: ["tickets", "my"],
    queryFn: async () => (await api.get("/api/tickets/my")).data.data
  });

  const walletQuery = useQuery({
    queryKey: ["wallet", "me"],
    queryFn: async () => (await api.get("/api/wallet/me")).data.data
  });

  const walletTxQuery = useQuery({
    queryKey: ["wallet", "transactions"],
    queryFn: async () => (await api.get("/api/wallet/me/transactions")).data.data
  });

  const { register, handleSubmit, reset, formState } = useForm({
    resolver: zodResolver(schema)
  });

  useEffect(() => {
    if (profileQuery.data) {
      reset({
        name: profileQuery.data.name || "",
        email: profileQuery.data.email || "",
        phone: profileQuery.data.phone || ""
      });
    }
  }, [profileQuery.data, reset]);

  const mutation = useMutation({
    mutationFn: async (values) => (await api.put("/api/users/me", values)).data.data,
    onSuccess: (data) => {
      setUser(data);
      toast.success("Profile updated");
      profileQuery.refetch();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Update failed");
    }
  });

  const themeMutation = useMutation({
    mutationFn: async (theme) => (await api.patch("/api/users/theme", { theme })).data.data,
    onSuccess: (data) => {
      setUser(data);
      toast.success("Theme updated");
    }
  });

  const addressMutation = useMutation({
    mutationFn: async () => (await api.post("/api/addresses", addressForm)).data.data,
    onSuccess: () => {
      toast.success("Address saved");
      setAddressForm({ label: "Home", fullAddress: "", city: "", landmark: "" });
      addressQuery.refetch();
      setShowAddressModal(false);
    }
  });

  const deleteAddressMutation = useMutation({
    mutationFn: async (id) => (await api.delete(`/api/addresses/${id}`)).data.data,
    onSuccess: () => {
      toast.success("Address removed");
      addressQuery.refetch();
    }
  });

  const ticketMutation = useMutation({
    mutationFn: async () => (await api.post("/api/tickets", ticketForm)).data.data,
    onSuccess: () => {
      toast.success("Ticket submitted");
      setTicketForm({ category: "Delivery", message: "" });
      ticketQuery.refetch();
      setShowTicketModal(false);
    }
  });

  const onSubmit = (values) => mutation.mutate(values);

  const primaryBtn = "rounded-full bg-primary-500 px-4 py-2 text-xs font-semibold text-white";
  const secondaryBtn = "rounded-full border border-orange-200 px-4 py-2 text-xs font-semibold text-orange-700";

  return (
    <section className="bg-gradient-to-b from-orange-50/70 to-transparent">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <SectionHeading title="My Account" subtitle="Manage your profile and preferences." />

        <div className="mt-6 grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="rounded-[20px] bg-white p-6 shadow-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-orange-500" />
                  <p className="font-semibold text-ink">Profile</p>
                </div>
                <button className={secondaryBtn}>Edit</button>
              </div>
              <form className="mt-4 space-y-3" onSubmit={handleSubmit(onSubmit)}>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 h-4 w-4 text-orange-400" />
                  <input
                    {...register("name")}
                    placeholder="Full name"
                    className="h-11 w-full rounded-xl border border-orange-100 pl-9 text-sm"
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-orange-400" />
                  <input
                    {...register("email")}
                    placeholder="Email"
                    className="h-11 w-full rounded-xl border border-orange-100 pl-9 text-sm"
                  />
                </div>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 h-4 w-4 text-orange-400" />
                  <input
                    {...register("phone")}
                    placeholder="Phone"
                    className="h-11 w-full rounded-xl border border-orange-100 pl-9 text-sm"
                  />
                </div>
                {Object.values(formState.errors).length > 0 && (
                  <p className="text-xs text-red-500">Please check your inputs.</p>
                )}
                <div className="flex justify-end">
                  <button type="submit" className={primaryBtn} disabled={mutation.isPending}>
                    Save Changes
                  </button>
                </div>
              </form>
            </div>

            <div className="rounded-[20px] bg-white p-6 shadow-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-orange-500" />
                  <p className="font-semibold text-ink">Saved Addresses</p>
                </div>
                <button className={secondaryBtn} onClick={() => setShowAddressModal(true)}>
                  + Add Address
                </button>
              </div>
              <div className="mt-4 space-y-3 text-sm text-gray-600">
                {addressQuery.data?.length === 0 && (
                  <p className="text-xs text-gray-500">No saved addresses yet.</p>
                )}
                {addressQuery.data?.map((address) => (
                  <div key={address._id} className="flex items-center justify-between rounded-xl border border-orange-100 px-4 py-3">
                    <div>
                      <p className="font-semibold text-ink">{address.label}</p>
                      <p className="text-xs text-gray-500">{address.fullAddress}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className={secondaryBtn}>Edit</button>
                      <button
                        onClick={() => deleteAddressMutation.mutate(address._id)}
                        className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[20px] bg-white p-6 shadow-card">
              <div className="flex items-center gap-2">
                <LifeBuoy className="h-4 w-4 text-orange-500" />
                <p className="font-semibold text-ink">Help & Support</p>
              </div>
              <p className="mt-2 text-xs text-gray-500">Raise a ticket and we will help quickly.</p>
              <button className={`mt-4 ${primaryBtn}`} onClick={() => setShowTicketModal(true)}>
                Create Ticket
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[20px] bg-white p-6 shadow-card">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-orange-500" />
                <p className="font-semibold text-ink">Preferences</p>
              </div>
              <div className="mt-4 space-y-3 text-xs text-gray-600">
                {[
                  { label: "Theme", desc: "Switch between light and dark", value: user?.theme === "dark" ? "Dark" : "Light" },
                  { label: "Order updates", desc: "SMS updates", value: "Enabled" },
                  { label: "Promotions", desc: "Special offers", value: "Enabled" },
                  { label: "Delivery reminders", desc: "Order reminders", value: "Enabled" }
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between rounded-xl border border-orange-100 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">{row.label}</p>
                      <p className="text-[11px] text-gray-500">{row.desc}</p>
                    </div>
                    {row.label === "Theme" ? (
                      <button
                        onClick={() => themeMutation.mutate(user?.theme === "dark" ? "light" : "dark")}
                        className={secondaryBtn}
                      >
                        {row.value}
                      </button>
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] text-emerald-600">{row.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[20px] bg-white p-6 shadow-card">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-orange-500" />
                <p className="font-semibold text-ink">Wallet</p>
              </div>
              <p className="mt-2 text-xs text-gray-500">Refunds and faster checkout.</p>
              <p className="mt-4 text-3xl font-semibold text-ink">Rs {walletQuery.data?.balance ?? 0}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to="/account" className={secondaryBtn}>View Transactions</Link>
                <button className={primaryBtn}>Add Money</button>
              </div>
              <div className="mt-4 space-y-2 text-xs text-gray-600">
                {walletTxQuery.data?.slice(0, 3).map((txn) => (
                  <div key={txn._id} className="flex items-center justify-between rounded-xl border border-orange-100 px-3 py-2">
                    <span>{txn.type}</span>
                    <span>Rs {txn.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[20px] bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-ink">Orders</p>
              <p className="text-xs text-gray-500">Track current orders and view past orders.</p>
            </div>
            <Link to="/orders" className={primaryBtn}>View Orders</Link>
          </div>
        </div>
      </div>

      {showAddressModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-[20px] bg-white p-6 shadow-card">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-ink">Add Address</p>
              <button onClick={() => setShowAddressModal(false)} className="text-xs text-gray-500">Close</button>
            </div>
            <div className="mt-4 space-y-3">
              <input
                value={addressForm.label}
                onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                placeholder="Label (Home/Office)"
                className="h-11 w-full rounded-xl border border-orange-100 px-4 text-sm"
              />
              <input
                value={addressForm.fullAddress}
                onChange={(e) => setAddressForm({ ...addressForm, fullAddress: e.target.value })}
                placeholder="Full address"
                className="h-11 w-full rounded-xl border border-orange-100 px-4 text-sm"
              />
              <input
                value={addressForm.city}
                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                placeholder="City"
                className="h-11 w-full rounded-xl border border-orange-100 px-4 text-sm"
              />
              <input
                value={addressForm.landmark}
                onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                placeholder="Landmark (optional)"
                className="h-11 w-full rounded-xl border border-orange-100 px-4 text-sm"
              />
              <button onClick={() => addressMutation.mutate()} className={primaryBtn}>Save Address</button>
            </div>
          </div>
        </div>
      )}

      {showTicketModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-[20px] bg-white p-6 shadow-card">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-ink">Create Ticket</p>
              <button onClick={() => setShowTicketModal(false)} className="text-xs text-gray-500">Close</button>
            </div>
            <div className="mt-4 space-y-3">
              <select
                value={ticketForm.category}
                onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                className="h-11 w-full rounded-xl border border-orange-100 px-4 text-sm"
              >
                {"Delivery,Payment,Food,Other".split(",").map((val) => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
              <textarea
                value={ticketForm.message}
                onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                placeholder="Describe the issue"
                className="w-full rounded-xl border border-orange-100 px-4 py-3 text-sm"
              />
              <button onClick={() => ticketMutation.mutate()} className={primaryBtn}>Submit Ticket</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Account;
