"use client";

import { signOut } from "next-auth/react";
import { Ban, MessageCircle, LogOut } from "lucide-react";
import { getDir } from "@/lib/i18n";

export function SuspendedScreen({ locale }: { locale: string }) {
  const isHe = locale === "he";

  return (
    <div dir={getDir(locale as "he" | "en")} className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-2xl rounded-2xl border bg-white p-10 text-center shadow-sm">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-red-100">
          <Ban className="size-7 text-red-600" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">
          {isHe ? "החשבון שלך מושעה" : "Your account is suspended"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500 whitespace-pre-line">
          {isHe
            ? "🚫 החשבון שלך הושעה.\nהאתר, ההודעות ולוח הבקרה אינם זמינים כרגע.\n📞 לחידוש החשבון, אנא צרו קשר."
            : "🚫 Your account has been suspended.\nYour site, notifications, and dashboard are currently unavailable.\n📞 To reactivate, please contact us."}
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <a
            href="https://wa.me/972526843000"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700"
          >
            <MessageCircle className="size-4" />
            {isHe ? "צור קשר בוואטסאפ" : "Contact us on WhatsApp"}
          </a>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            <LogOut className="size-4" />
            {isHe ? "התנתק" : "Sign out"}
          </button>
        </div>
      </div>
    </div>
  );
}
