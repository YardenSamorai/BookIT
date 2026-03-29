"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const t = useT();

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
        aria-label="Toggle menu"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-50 border-b border-slate-200 bg-white/95 shadow-lg backdrop-blur-lg">
          <div className="flex flex-col gap-1 px-5 py-4">
            <a
              href="#features"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              {t("landing.nav_features" as never)}
            </a>
            <a
              href="#pricing"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              {t("landing.nav_pricing" as never)}
            </a>
            <a
              href="#contact"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              {t("landing.contact_call" as never)}
            </a>
            <hr className="my-2 border-slate-200" />
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              {t("landing.nav_login" as never)}
            </Link>
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-3 py-2.5 text-center text-sm font-semibold text-white shadow-md shadow-blue-500/20"
            >
              {t("landing.nav_cta" as never)}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
