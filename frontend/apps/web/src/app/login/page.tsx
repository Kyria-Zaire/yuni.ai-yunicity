"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useAuth } from "@yuni/auth";
import { YuniButton } from "@yuni/ui";

const schema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (data) => {
    try {
      await login(data.email, data.password);
      router.push("/profile");
    } catch (e) {
      setError("root", {
        message: e instanceof Error ? e.message : "Connexion impossible",
      });
    }
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-yuni-terracotta-100 to-yuni-wheat-50 px-6">
      <div className="w-full max-w-md space-y-8 rounded-yuni-xl bg-white/90 p-8 shadow-yuni-lg backdrop-blur">
        <div className="text-center">
          <p className="font-editorial text-3xl text-yuni-terracotta-700">
            Yuni
          </p>
          <p className="mt-2 text-sm text-yuni-slate-600">
            Ta ville te reconnaît
          </p>
        </div>
        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-yuni-slate-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full rounded-yuni-md border border-yuni-wheat-100 bg-white px-3 py-2 text-yuni-slate-900 outline-none ring-yuni-terracotta-500 focus:ring-2"
              {...register("email")}
            />
            {errors.email ? (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            ) : null}
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-yuni-slate-700"
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="w-full rounded-yuni-md border border-yuni-wheat-100 bg-white px-3 py-2 text-yuni-slate-900 outline-none ring-yuni-terracotta-500 focus:ring-2"
              {...register("password")}
            />
            {errors.password ? (
              <p className="mt-1 text-xs text-red-600">
                {errors.password.message}
              </p>
            ) : null}
          </div>
          {errors.root ? (
            <p className="text-sm text-red-600">{errors.root.message}</p>
          ) : null}
          <YuniButton
            type="submit"
            className="w-full"
            loading={isSubmitting}
          >
            Connexion
          </YuniButton>
        </form>
        <p className="text-center text-sm text-yuni-slate-600">
          Nouveau sur ta ville ?{" "}
          <Link href="/onboarding" className="text-yuni-slate-800 underline">
            Découvrir le guide
          </Link>
        </p>
      </div>
    </div>
  );
}
