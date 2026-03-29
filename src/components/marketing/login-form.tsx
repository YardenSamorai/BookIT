"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export function LoginForm() {
  const router = useRouter();
  const t = useT();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const result = await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirect: false,
    });

    if (result?.error) {
      setError(t("auth.invalid_credentials" as Parameters<typeof t>[0]));
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError(null);
    await signIn("google", { callbackUrl: "/dashboard" });
  }

  return (
    <div className="space-y-5">
      {/* Google button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={googleLoading || loading}
        className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] disabled:opacity-60"
      >
        {googleLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <GoogleIcon className="size-5" />
        )}
        {t("auth.continue_google")}
      </button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-gray-400">
            {t("auth.or" as Parameters<typeof t>[0])}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
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
              className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50/50 ps-10 pe-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              {t("auth.password")}
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              {t("auth.forgot_password" as Parameters<typeof t>[0])}
            </Link>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5">
              <Lock className="size-4 text-gray-400" />
            </div>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              dir="ltr"
              className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50/50 ps-10 pe-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
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
          disabled={loading || googleLoading}
          className="h-11 w-full rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-600/30 disabled:opacity-60"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              {t("auth.logging_in")}
            </span>
          ) : (
            t("auth.login")
          )}
        </Button>
      </form>

      <div className="relative my-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-gray-400">
            {t("auth.no_account")}
          </span>
        </div>
      </div>

      <Link
        href="/signup"
        className="flex h-11 w-full items-center justify-center rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50"
      >
        {t("auth.signup")}
      </Link>
    </div>
  );
}
