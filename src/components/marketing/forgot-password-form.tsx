"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { requestPasswordReset, resetPassword } from "@/actions/auth";
import { Mail, Lock, KeyRound, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";

type Step = "email" | "code" | "done";

const inputClass =
  "h-12 w-full rounded-xl border border-gray-200 bg-gray-50/50 ps-11 pe-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:shadow-sm";

export function ForgotPasswordForm() {
  const t = useT();
  const k = (key: string) => key as Parameters<typeof t>[0];

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [phoneMasked, setPhoneMasked] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await requestPasswordReset(email);

    if (!result.success) {
      if (result.error === "NO_ACCOUNT") {
        setError(t(k("auth.invalid_credentials")));
      } else if (result.error === "NO_PHONE") {
        setError(t(k("auth.reset_no_phone")));
      } else if (result.error === "RATE_LIMIT") {
        setError("Too many attempts. Please wait a few minutes.");
      } else {
        setError(result.error || "Error");
      }
      setLoading(false);
      return;
    }

    setPhoneMasked(result.data!.phoneMasked);
    setStep("code");
    setLoading(false);
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await resetPassword(email, code, newPassword);

    if (!result.success) {
      setError(result.error || "Error");
      setLoading(false);
      return;
    }

    setStep("done");
    setLoading(false);
  }

  if (step === "done") {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="size-8 text-emerald-600" />
        </div>
        <p className="text-base font-medium text-gray-900">
          {t(k("auth.reset_success"))}
        </p>
        <Link
          href="/login"
          className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 active:scale-[0.98]"
        >
          {t(k("auth.login"))}
          <ArrowRight className="size-4 rtl:rotate-180" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {step === "email" && (
        <form onSubmit={handleSendCode} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-[13px] font-medium text-gray-600">
              {t(k("auth.reset_email_label"))}
            </Label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5">
                <Mail className="size-[18px] text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                dir="ltr"
                className={inputClass}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-600/25 active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                {t(k("auth.sending"))}
              </span>
            ) : (
              t(k("auth.reset_send_code"))
            )}
          </Button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={handleResetPassword} className="space-y-5">
          <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {t(k("auth.reset_code_sent"))}
            <br />
            <span className="font-mono font-medium" dir="ltr">{phoneMasked}</span>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="code" className="text-[13px] font-medium text-gray-600">
              {t(k("auth.reset_code_label"))}
            </Label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5">
                <KeyRound className="size-[18px] text-gray-400" />
              </div>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                required
                maxLength={6}
                dir="ltr"
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50/50 ps-11 pe-4 text-center text-lg font-mono tracking-[0.3em] text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="newPassword" className="text-[13px] font-medium text-gray-600">
              {t(k("auth.reset_new_password"))}
            </Label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5">
                <Lock className="size-[18px] text-gray-400" />
              </div>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="לפחות 8 תווים"
                required
                minLength={8}
                dir="ltr"
                className={inputClass}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-600/25 active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                {t(k("auth.resetting"))}
              </span>
            ) : (
              t(k("auth.reset_confirm"))
            )}
          </Button>
        </form>
      )}

      <p className="text-center text-sm text-gray-500">
        <Link
          href="/login"
          className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          {t(k("auth.reset_back"))}
        </Link>
      </p>
    </div>
  );
}
