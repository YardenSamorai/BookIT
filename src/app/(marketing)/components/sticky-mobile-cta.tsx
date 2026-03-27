"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n/locale-context";

export function StickyMobileCta() {
  const t = useT();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const threshold = 600;
    function onScroll() {
      setVisible(window.scrollY > threshold);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 p-3 backdrop-blur-md md:hidden">
      <Link
        href="/signup"
        className="block w-full rounded-xl bg-blue-600 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-blue-700"
      >
        {t("landing.mobile_cta" as never)}
      </Link>
    </div>
  );
}
