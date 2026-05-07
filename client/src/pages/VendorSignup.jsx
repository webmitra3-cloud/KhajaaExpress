import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "../lib/api";

const schema = z.object({
  restaurantName: z.string().min(2),
  ownerName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  address: z.string().min(3),
  city: z.string().min(2),
  password: z.string().min(6)
});

const VendorSignup = () => {
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(schema)
  });

  const mutation = useMutation({
    mutationFn: async (values) => (await api.post("/api/auth/vendor-signup", values)).data.data,
    onSuccess: () => {
      toast.success("Registration submitted. Await approval.");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Signup failed");
    }
  });

  const onSubmit = (values) => mutation.mutate(values);

  return (
    <section className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-3xl bg-white p-8 shadow-card">
        <h2 className="font-display text-2xl text-ink">Vendor Signup</h2>
        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <input
            {...register("restaurantName")}
            placeholder="Restaurant name"
            className="rounded-2xl border border-orange-100 px-4 py-3 text-sm"
          />
          <input
            {...register("ownerName")}
            placeholder="Owner name"
            className="rounded-2xl border border-orange-100 px-4 py-3 text-sm"
          />
          <input
            {...register("email")}
            placeholder="Email"
            className="rounded-2xl border border-orange-100 px-4 py-3 text-sm"
          />
          <input
            {...register("phone")}
            placeholder="Phone"
            className="rounded-2xl border border-orange-100 px-4 py-3 text-sm"
          />
          <input
            {...register("address")}
            placeholder="Address"
            className="rounded-2xl border border-orange-100 px-4 py-3 text-sm md:col-span-2"
          />
          <input
            {...register("city")}
            placeholder="City"
            className="rounded-2xl border border-orange-100 px-4 py-3 text-sm"
          />
          <input
            type="password"
            {...register("password")}
            placeholder="Password"
            className="rounded-2xl border border-orange-100 px-4 py-3 text-sm"
          />
          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full rounded-full bg-primary-500 px-6 py-3 text-sm font-semibold text-white"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Submitting..." : "Submit"}
            </button>
          </div>
          {Object.values(formState.errors).length > 0 && (
            <p className="md:col-span-2 text-xs text-red-500">Please fill all required fields.</p>
          )}
        </form>
      </div>
    </section>
  );
};

export default VendorSignup;
