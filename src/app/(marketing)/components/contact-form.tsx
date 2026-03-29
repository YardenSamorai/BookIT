"use client";

import { useState } from "react";
import { Loader2, Check } from "lucide-react";

interface ContactFormProps {
  whatsappNumber: string;
}

export function ContactForm({ whatsappNumber }: ContactFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [business, setBusiness] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    setSending(true);

    const message = encodeURIComponent(
      `שלום, אני מתעניין/ת ב-BookIT!\nשם: ${name.trim()}\nטלפון: ${phone.trim()}${business.trim() ? `\nעסק: ${business.trim()}` : ""}`
    );
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");

    setSending(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500">
          <Check className="size-6 text-white" />
        </div>
        <p className="text-base font-semibold text-slate-900">הפרטים התקבלו!</p>
        <p className="text-sm text-slate-500">נחזור אליכם בהקדם.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="שם מלא"
        required
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="מספר טלפון"
        required
        dir="ltr"
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <input
        type="text"
        value={business}
        onChange={(e) => setBusiness(e.target.value)}
        placeholder="שם העסק (אופציונלי)"
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <button
        type="submit"
        disabled={sending || !name.trim() || !phone.trim()}
        className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:shadow-blue-500/30 hover:brightness-105 disabled:opacity-50"
      >
        {sending ? <Loader2 className="mx-auto size-4 animate-spin" /> : "שלחו פרטים"}
      </button>
    </form>
  );
}
