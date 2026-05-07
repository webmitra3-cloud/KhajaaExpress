import { useSearchParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "../lib/api";

const schema = z.object({
  password: z.string().min(6)
});

const ResetPassword = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token");

  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(schema)
  });

  const mutation = useMutation({
    mutationFn: async (values) =>
      (await api.post("/api/auth/reset-password", { token, password: values.password })).data.data,
    onSuccess: () => {
      toast.success("Password reset successful");
      navigate("/login");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Reset failed");
    }
  });

  if (!token) {
    return <section className="mx-auto max-w-md px-4 py-10">Invalid reset link.</section>;
  }

  return (
    <section className="mx-auto max-w-md px-4 py-10">
      <div className="rounded-[32px] bg-white p-8 shadow-card">
        <h2 className="font-display text-2xl text-ink">Reset Password</h2>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
          <input
            type="password"
            {...register("password")}
            placeholder="New password"
            className="w-full rounded-2xl border border-orange-100 px-4 py-3 text-sm"
          />
          {formState.errors.password && (
            <p className="text-xs text-red-500">{formState.errors.password.message}</p>
          )}
          <button type="submit" className="w-full rounded-full bg-primary-500 px-6 py-3 text-sm font-semibold text-white">
            Reset Password
          </button>
        </form>
      </div>
    </section>
  );
};

export default ResetPassword;
