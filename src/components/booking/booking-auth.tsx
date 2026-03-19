"use client";

import { useState, useRef, useEffect } from "react";
import { signIn } from "next-auth/react";
import { Phone, ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useT } from "@/lib/i18n/locale-context";

interface BookingAuthProps {
  secondaryColor: string;
  onAuthenticated: () => void;
}

type AuthStep = "phone" | "code" | "name";

export function BookingAuth({ secondaryColor, onAuthenticated }: BookingAuthProps) {
  const t = useT();
  const [authStep, setAuthStep] = useState<AuthStep>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (authStep === "code" && codeInputRef.current) {
      codeInputRef.current.focus();
    }
  }, [authStep]);

  async function handleSendOtp() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send code");
        setLoading(false);
        return;
      }

      setAuthStep("code");
    } catch {
      setError("Failed to send code");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    setError("");
    setLoading(true);

    try {
      const checkRes = await fetch("/api/auth/check-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const checkData = await checkRes.json();

      const needsName = !checkData.exists || !checkData.hasName;

      if (needsName) {
        setAuthStep("name");
        setLoading(false);
        return;
      }

      const result = await signIn("phone-otp", {
        phone,
        code,
        redirect: false,
      });

      if (result?.error) {
        setError(t("book.login_to_book"));
        setLoading(false);
        return;
      }

      onAuthenticated();
    } catch {
      setError("Verification failed");
      setLoading(false);
    }
  }

  async function handleNameSubmit() {
    if (firstName.trim().length < 2 || lastName.trim().length < 1) return;
    setError("");
    setLoading(true);

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

    try {
      const result = await signIn("phone-otp", {
        phone,
        code,
        name: fullName,
        redirect: false,
      });

      if (result?.error) {
        setError(t("book.login_to_book"));
        setLoading(false);
        return;
      }

      onAuthenticated();
    } catch {
      setError("Verification failed");
      setLoading(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <AnimatePresence mode="wait">
        {authStep === "phone" && (
          <motion.div
            key="phone"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="p-5"
          >
            <div className="mb-4 flex items-center gap-3">
              <div
                className="flex size-10 items-center justify-center rounded-xl"
                style={{ background: `${secondaryColor}12`, color: secondaryColor }}
              >
                <Phone className="size-5" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-gray-900">
                  {t("book.phone_login_title")}
                </h3>
                <p className="text-[12px] text-gray-400">
                  {t("book.phone_login_desc")}
                </p>
              </div>
            </div>

            <input
              type="tel"
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("book.phone_placeholder")}
              className="w-full rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3.5 text-center text-base tracking-wider transition-all placeholder:text-gray-300 focus:border-gray-200 focus:bg-white focus:outline-none focus:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
              onKeyDown={(e) => e.key === "Enter" && phone.length >= 10 && handleSendOtp()}
            />

            {error && (
              <p className="mt-2 text-xs text-red-500">{error}</p>
            )}

            <button
              type="button"
              onClick={handleSendOtp}
              disabled={loading || phone.length < 10}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${secondaryColor}, ${secondaryColor}dd)`,
                boxShadow: `0 2px 12px ${secondaryColor}30`,
              }}
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              {loading ? t("book.sending") : t("book.send_code")}
            </button>
          </motion.div>
        )}

        {authStep === "code" && (
          <motion.div
            key="code"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="p-5"
          >
            <button
              type="button"
              onClick={() => { setAuthStep("phone"); setCode(""); setError(""); }}
              className="mb-3 flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-gray-600"
            >
              <ArrowLeft className="size-3 rtl:rotate-180" />
              {t("book.wrong_number")}
            </button>

            <div className="mb-4 flex items-center gap-3">
              <div
                className="flex size-10 items-center justify-center rounded-xl"
                style={{ background: `${secondaryColor}12`, color: secondaryColor }}
              >
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-gray-900">
                  {t("book.enter_code")}
                </h3>
                <p className="text-[12px] text-gray-400" dir="ltr">
                  {t("book.code_sent_to", { phone })}
                </p>
              </div>
            </div>

            <input
              ref={codeInputRef}
              type="text"
              inputMode="numeric"
              dir="ltr"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder={t("book.code_placeholder")}
              className="w-full rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3.5 text-center text-2xl font-bold tracking-[0.3em] transition-all placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-gray-300 focus:border-gray-200 focus:bg-white focus:outline-none focus:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
              onKeyDown={(e) => e.key === "Enter" && code.length === 6 && handleVerifyOtp()}
            />

            {error && (
              <p className="mt-2 text-xs text-red-500">{error}</p>
            )}

            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={loading || code.length !== 6}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${secondaryColor}, ${secondaryColor}dd)`,
                boxShadow: `0 2px 12px ${secondaryColor}30`,
              }}
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              {loading ? t("book.verifying") : t("book.verify")}
            </button>

            <button
              type="button"
              onClick={() => { setCode(""); setError(""); handleSendOtp(); }}
              disabled={loading}
              className="mt-2 w-full text-center text-xs text-gray-400 transition-colors hover:text-gray-600"
            >
              {t("book.resend_code")}
            </button>
          </motion.div>
        )}

        {authStep === "name" && (
          <motion.div
            key="name"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="p-5"
          >
            <h3 className="mb-4 text-[15px] font-bold text-gray-900">
              {t("book.enter_name")}
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={t("book.first_name_placeholder")}
                className="w-full rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3.5 text-center text-base transition-all placeholder:text-gray-300 focus:border-gray-200 focus:bg-white focus:outline-none focus:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                autoFocus
              />
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={t("book.last_name_placeholder")}
                className="w-full rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3.5 text-center text-base transition-all placeholder:text-gray-300 focus:border-gray-200 focus:bg-white focus:outline-none focus:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                onKeyDown={(e) => e.key === "Enter" && firstName.trim().length >= 2 && lastName.trim().length >= 1 && handleNameSubmit()}
              />
            </div>

            {error && (
              <p className="mt-2 text-xs text-red-500">{error}</p>
            )}

            <button
              type="button"
              onClick={handleNameSubmit}
              disabled={loading || firstName.trim().length < 2 || lastName.trim().length < 1}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${secondaryColor}, ${secondaryColor}dd)`,
                boxShadow: `0 2px 12px ${secondaryColor}30`,
              }}
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              {loading ? t("book.verifying") : t("book.continue")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
