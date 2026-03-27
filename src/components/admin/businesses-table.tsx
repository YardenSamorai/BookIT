"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { Search, ExternalLink, Power, PowerOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  changeBusinessPlan,
  changeBusinessStatus,
} from "@/actions/admin";

interface BusinessRow {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  brandingRemoved: boolean;
  createdAt: Date;
  owner: { name: string; email: string | null; phone: string | null } | null;
  messages: { sent: number; quota: number };
  billingStatus: string | null;
}

const PLAN_STYLES: Record<string, string> = {
  FREE: "bg-slate-100 text-slate-600",
  STARTER: "bg-blue-100 text-blue-700",
  PRO: "bg-violet-100 text-violet-700",
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  PAST_DUE: "bg-amber-100 text-amber-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const BILLING_STYLES: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  OVERDUE: "bg-red-100 text-red-700",
  WAIVED: "bg-slate-100 text-slate-600",
};

export function BusinessesTable({ businesses }: { businesses: BusinessRow[] }) {
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return businesses.filter((biz) => {
      if (planFilter && biz.plan !== planFilter) return false;
      if (statusFilter && biz.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const nameMatch = biz.name.toLowerCase().includes(q);
        const ownerMatch = biz.owner?.name.toLowerCase().includes(q);
        const phoneMatch = biz.owner?.phone?.includes(q);
        const emailMatch = biz.owner?.email?.toLowerCase().includes(q);
        if (!nameMatch && !ownerMatch && !phoneMatch && !emailMatch) return false;
      }
      return true;
    });
  }, [businesses, search, planFilter, statusFilter]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="חיפוש עסקים..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">כל החבילות</option>
          <option value="FREE">FREE</option>
          <option value="STARTER">STARTER</option>
          <option value="PRO">PRO</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">כל הסטטוסים</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="PAST_DUE">PAST_DUE</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
        <span className="text-sm text-muted-foreground">{filtered.length} עסקים</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-right">
              <th className="px-4 py-3 font-medium text-muted-foreground">שם העסק</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">בעלים</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">חבילה ▾</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">סטטוס ▾</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">הודעות</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">חיוב</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">נוצר</th>
              <th className="px-4 py-3 font-medium text-muted-foreground" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  לא נמצאו תוצאות
                </td>
              </tr>
            ) : (
              filtered.map((biz) => {
                const msgPct =
                  biz.messages.quota > 0
                    ? Math.min(100, Math.round((biz.messages.sent / biz.messages.quota) * 100))
                    : 0;

                return (
                  <tr key={biz.id} className="border-b last:border-0 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/businesses/${biz.id}`}
                        className="font-medium text-slate-900 hover:text-blue-600 hover:underline"
                      >
                        {biz.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-slate-700">{biz.owner?.name}</p>
                        <p className="text-xs text-muted-foreground" dir="ltr">
                          {biz.owner?.phone || biz.owner?.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={biz.plan}
                        disabled={pending}
                        onChange={(e) => {
                          startTransition(async () => {
                            await changeBusinessPlan(biz.id, e.target.value as "FREE" | "STARTER" | "PRO");
                          });
                        }}
                        className={`cursor-pointer rounded-full border-0 px-2 py-0.5 text-[10px] font-semibold outline-none ${PLAN_STYLES[biz.plan] ?? PLAN_STYLES.FREE}`}
                      >
                        <option value="FREE">FREE</option>
                        <option value="STARTER">STARTER</option>
                        <option value="PRO">PRO</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[biz.status] ?? STATUS_STYLES.ACTIVE}`}>
                          {biz.status}
                        </span>
                        <button
                          disabled={pending}
                          onClick={() => {
                            const newStatus = biz.status === "ACTIVE" ? "CANCELLED" : "ACTIVE";
                            startTransition(async () => {
                              await changeBusinessStatus(biz.id, newStatus);
                            });
                          }}
                          className={`rounded p-1 transition-colors ${
                            biz.status === "ACTIVE"
                              ? "text-red-400 hover:bg-red-50 hover:text-red-600"
                              : "text-emerald-400 hover:bg-emerald-50 hover:text-emerald-600"
                          }`}
                          title={biz.status === "ACTIVE" ? "השעה חשבון" : "הפעל חשבון"}
                        >
                          {biz.status === "ACTIVE" ? (
                            <PowerOff className="size-3.5" />
                          ) : (
                            <Power className="size-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${
                              msgPct >= 80 ? "bg-red-500" : msgPct >= 50 ? "bg-amber-400" : "bg-emerald-500"
                            }`}
                            style={{ width: `${msgPct}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {biz.messages.sent}/{biz.messages.quota}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {biz.billingStatus ? (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${BILLING_STYLES[biz.billingStatus] ?? ""}`}>
                          {biz.billingStatus}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(biz.createdAt).toLocaleDateString("he-IL")}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/b/${biz.slug}`}
                        target="_blank"
                        className="text-muted-foreground hover:text-blue-600"
                      >
                        <ExternalLink className="size-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
