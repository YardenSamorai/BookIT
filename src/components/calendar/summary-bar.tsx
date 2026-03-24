"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Users,
} from "lucide-react";
import type { CalendarKPIs } from "./calendar-types";

interface SummaryBarProps {
  kpis: CalendarKPIs;
  onFilterPending?: () => void;
}

type StatDef = {
  key: keyof CalendarKPIs;
  icon: React.ElementType;
  label: string;
  labelHe: string;
  accent?: string;
  showWhenZero?: boolean;
};

const STATS: StatDef[] = [
  { key: "totalAppointments", icon: CalendarDays, label: "Today", labelHe: "היום", showWhenZero: true },
  { key: "confirmed", icon: CheckCircle2, label: "Confirmed", labelHe: "מאושרים", accent: "text-emerald-600" },
  { key: "pending", icon: Clock, label: "Pending", labelHe: "ממתינים", accent: "text-amber-600" },
  { key: "noShow", icon: XCircle, label: "No-Show", labelHe: "לא הגיעו", accent: "text-red-600" },
  { key: "totalClasses", icon: CalendarDays, label: "Classes", labelHe: "שיעורים" },
  { key: "activeProviders", icon: Users, label: "Active", labelHe: "פעילים", showWhenZero: true },
];

export function SummaryBar({ kpis, onFilterPending }: SummaryBarProps) {
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const hasPending = kpis.pending > 0;

  return (
    <>
      {/* Desktop: full stat row */}
      <div className="hidden md:flex items-center gap-2 rounded-lg border bg-card p-2">
        {STATS.map((stat) => {
          const val = kpis[stat.key];
          if (!val && !stat.showWhenZero) return null;
          const Icon = stat.icon;
          const isPending = stat.key === "pending" && hasPending;
          return (
            <button
              key={stat.key}
              onClick={isPending ? onFilterPending : undefined}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                isPending
                  ? "bg-amber-50 text-amber-700 hover:bg-amber-100 cursor-pointer"
                  : "text-muted-foreground cursor-default"
              }`}
            >
              <Icon className={`size-3.5 ${stat.accent ?? ""}`} />
              <span className="font-semibold tabular-nums">{val}</span>
              <span className="text-xs">{stat.labelHe}</span>
            </button>
          );
        })}
        {kpis.conflicts > 0 && (
          <div className="flex items-center gap-1.5 rounded-md bg-red-50 px-3 py-1.5 text-sm text-red-700">
            <AlertTriangle className="size-3.5" />
            <span className="font-semibold tabular-nums">{kpis.conflicts}</span>
            <span className="text-xs">התנגשויות</span>
          </div>
        )}
      </div>

      {/* Mobile: collapsed line, expandable */}
      <div className="md:hidden">
        <button
          onClick={() => setMobileExpanded((v) => !v)}
          className="flex w-full items-center justify-center gap-2 rounded-md border bg-card px-3 py-1.5 text-xs"
        >
          <span className="font-medium tabular-nums">
            {kpis.totalAppointments} תורים
          </span>
          {hasPending && (
            <span className="font-medium text-amber-600">
              · {kpis.pending} ממתינים
            </span>
          )}
          {kpis.conflicts > 0 && (
            <span className="font-medium text-red-600">
              · {kpis.conflicts} התנגשויות
            </span>
          )}
          <span className="text-muted-foreground">
            · {kpis.activeProviders} פעילים
          </span>
        </button>

        {mobileExpanded && (
          <div className="mt-1 grid grid-cols-3 gap-1">
            {STATS.map((stat) => {
              const val = kpis[stat.key];
              if (!val && !stat.showWhenZero) return null;
              const Icon = stat.icon;
              return (
                <div
                  key={stat.key}
                  className="flex items-center gap-1 rounded-md border bg-card px-2 py-1 text-xs"
                >
                  <Icon className={`size-3 ${stat.accent ?? "text-muted-foreground"}`} />
                  <span className="font-semibold tabular-nums">{val}</span>
                  <span className="text-muted-foreground truncate">{stat.labelHe}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
