"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { registerBusinessOwner } from "@/actions/auth";
import { signIn } from "next-auth/react";
import { User, Mail, Lock, Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";

export function SignupForm() {
  const router = useRouter();
  const t = useT();
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const result = await registerBusinessOwner({ name, email, password });

    if (!result.success) {
      setError(result.error);
      setFieldError(result.field || null);
      setLoading(false);
      return;
    }

    const signInResult = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (signInResult?.error) {
      setError("החשבון נוצר אך ההתחברות נכשלה. נסו להתחבר.");
      setLoading(false);
      return;
    }

    router.push("/onboarding");
  }

  const inputClass = (field: string) =>
    `h-11 w-full rounded-xl border bg-gray-50/50 ps-10 pe-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:ring-4 ${
      fieldError === field
        ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
        : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/10"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium text-gray-700">
          {t("auth.full_name")}
        </Label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5">
            <User className="size-4 text-gray-400" />
          </div>
          <input
            id="name"
            name="name"
            type="text"
            placeholder="ישראל ישראלי"
            required
            autoComplete="name"
            className={inputClass("name")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
          {t("auth.email")}
        </Label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5">
            <Mail className="size-4 text-gray-400" />
          </div>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
            dir="ltr"
            className={inputClass("email")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-gray-700">
          {t("auth.password")}
        </Label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5">
            <Lock className="size-4 text-gray-400" />
          </div>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="לפחות 8 תווים"
            required
            minLength={8}
            autoComplete="new-password"
            dir="ltr"
            className={inputClass("password")}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="h-11 w-full rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-600/30 disabled:opacity-60"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            {t("auth.creating")}
          </span>
        ) : (
          t("auth.signup")
        )}
      </Button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-gray-400">
            {t("auth.have_account")}
          </span>
        </div>
      </div>

      <Link
        href="/login"
        className="flex h-11 w-full items-center justify-center rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50"
      >
        {t("auth.login")}
      </Link>
    </form>
  );
}
