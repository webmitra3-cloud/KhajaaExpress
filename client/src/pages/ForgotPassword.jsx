import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import api from "../lib/api";

const schema = z.object({
  email: z.string().email()
});

const ForgotPassword = () => {
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(schema)
  });
  const [resetUrl, setResetUrl] = useState("");

  const mutation = useMutation({
    mutationFn: async (values) => (await api.post("/api/auth/forgot-password", values)).data.data,
    onSuccess: (data) => {
      setResetUrl(data?.resetUrl || "");
      toast.success("If the email exists, a reset link was sent.");
    },
    onError: () => {
      toast.error("Request failed");
    }
  });

  return (
    <section className="mx-auto max-w-md px-4 py-10">
      <div className="rounded-[32px] bg-white p-8 shadow-card">
        <h2 className="font-display text-2xl text-ink">Forgot Password</h2>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
          <input
            {...register("email")}
            placeholder="Email"
            className="w-full rounded-2xl border border-orange-100 px-4 py-3 text-sm"
          />
          {formState.errors.email && (
            <p className="text-xs text-red-500">{formState.errors.email.message}</p>
          )}
          {resetUrl && (
            <p className="rounded-xl border border-orange-100 bg-orange-50 px-3 py-2 text-xs text-orange-700">
              SMTP not configured. Use this reset link:{" "}
              <a href={resetUrl} className="font-semibold underline">
                {resetUrl}
              </a>
            </p>
          )}
          <button type="submit" className="w-full rounded-full bg-primary-500 px-6 py-3 text-sm font-semibold text-white">
            Send Reset Link
          </button>
        </form>
      </div>
    </section>
  );
};

export default ForgotPassword;
