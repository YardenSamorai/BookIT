"use client";

import { useState } from "react";
import { Check, X, ChevronDown } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";

type CellValue = true | false | string;

interface CompareRow {
  key: string;
  starter: CellValue;
  pro: CellValue;
}

interface CompareSection {
  label: string;
  rows: CompareRow[];
}

const compareSections: CompareSection[] = [
  {
    label: "landing.compare_core",
    rows: [
      { key: "landing.compare_calendar", starter: true, pro: true },
      { key: "landing.compare_booking_site", starter: true, pro: true },
      { key: "landing.compare_crm", starter: true, pro: true },
      { key: "landing.compare_wa", starter: true, pro: true },
      { key: "landing.compare_sms", starter: true, pro: true },
      { key: "landing.compare_classes", starter: true, pro: true },
      { key: "landing.compare_cards", starter: true, pro: true },
      { key: "landing.compare_analytics", starter: true, pro: true },
      { key: "landing.compare_products", starter: true, pro: true },
      { key: "landing.compare_pwa", starter: true, pro: true },
    ],
  },
  {
    label: "landing.compare_limits",
    rows: [
      { key: "landing.compare_staff", starter: "3", pro: "landing.compare_unlimited" },
      { key: "landing.compare_services", starter: "15", pro: "landing.compare_unlimited" },
      { key: "landing.compare_msgs", starter: "300", pro: "1,500" },
      { key: "landing.compare_templates", starter: "5", pro: "landing.compare_unlimited" },
      { key: "landing.compare_gallery", starter: "25", pro: "50" },
      { key: "landing.compare_products_limit", starter: "10", pro: "landing.compare_unlimited" },
    ],
  },
  {
    label: "landing.compare_premium",
    rows: [
      { key: "landing.compare_themes", starter: false, pro: true },
      { key: "landing.compare_branding", starter: false, pro: true },
      { key: "landing.compare_subdomain", starter: false, pro: true },
    ],
  },
];

function RenderCell({ val, t }: { val: CellValue; t: (k: never) => string }) {
  if (val === true)
    return (
      <div className="flex size-6 items-center justify-center rounded-full bg-emerald-100">
        <Check className="size-3.5 text-emerald-600" />
      </div>
    );
  if (val === false)
    return (
      <div className="flex size-6 items-center justify-center rounded-full bg-red-50">
        <X className="size-3.5 text-red-400" />
      </div>
    );
  if (val.startsWith("landing."))
    return <span className="text-sm font-medium text-slate-700">{t(val as never)}</span>;
  return <span className="text-sm font-medium text-slate-700">{val}</span>;
}

export function CompareTable() {
  const t = useT();
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto mt-14 max-w-3xl">
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="mx-auto flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-slate-400 hover:bg-slate-50"
      >
        {t("landing.compare_title" as never)}
        <ChevronDown
          className={`size-4 text-slate-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Collapsible table */}
      <div
        className={`grid transition-all duration-500 ease-in-out ${
          open ? "mt-8 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_100px_100px] items-center border-b border-slate-200 bg-slate-50 px-5 py-4 sm:grid-cols-[1fr_120px_120px]">
              <div />
              <div className="text-center text-sm font-bold text-slate-600">
                {t("landing.plan_starter" as never)}
              </div>
              <div className="text-center text-sm font-bold text-blue-600">
                {t("landing.plan_pro" as never)}
              </div>
            </div>

            {compareSections.map((section, si) => (
              <div key={section.label}>
                <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {t(section.label as never)}
                  </span>
                </div>

                {section.rows.map((row, ri) => (
                  <div
                    key={row.key}
                    className={`grid grid-cols-[1fr_100px_100px] items-center px-5 py-3.5 sm:grid-cols-[1fr_120px_120px] ${
                      ri < section.rows.length - 1 || si < compareSections.length - 1
                        ? "border-b border-slate-100"
                        : ""
                    } ${ri % 2 === 1 ? "bg-slate-50/30" : ""}`}
                  >
                    <span className="text-sm text-slate-700">{t(row.key as never)}</span>
                    <div className="flex justify-center">
                      <RenderCell val={row.starter} t={t} />
                    </div>
                    <div className="flex justify-center">
                      <RenderCell val={row.pro} t={t} />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Close button at bottom */}
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-slate-400 transition-colors hover:text-slate-600"
            >
              {t("landing.compare_close" as never)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
