import { DollarSign, TrendingUp, Building2, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRevenueStats } from "@/actions/admin";

const PLAN_LABELS: Record<string, string> = {
  FREE: "חינם",
  STARTER: "מתחילים",
  PRO: "מקצועי",
};

const PLAN_BAR_CLASS: Record<string, string> = {
  FREE: "bg-slate-400",
  STARTER: "bg-blue-500",
  PRO: "bg-violet-500",
};

function formatPeriodHe(period: string): string {
  const [y, m] = period.split("-").map(Number);
  if (!y || !m) return period;
  return new Date(y, m - 1, 1).toLocaleDateString("he-IL", {
    month: "short",
    year: "numeric",
  });
}

export default async function AdminRevenuePage() {
  const data = await getRevenueStats();

  const totalPlans = data.planDistribution.reduce((s, p) => s + p.count, 0) || 1;
  const maxMonthly = Math.max(...data.monthlyRevenue.map((m) => m.amount), 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">הכנסות</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          סקירת מנויים פעילים, הכנסות חודשיות וסה&quot;כ לתקופה
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">MRR (הכנסה חוזרת חודשית)</p>
                <p className="mt-1 text-3xl font-bold tabular-nums">
                  ₪{data.mrr.toLocaleString("he-IL")}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3">
                <TrendingUp className="size-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">סה&quot;כ הכנסות (שולם)</p>
                <p className="mt-1 text-3xl font-bold tabular-nums">
                  ₪{data.totalRevenue.toLocaleString("he-IL")}
                </p>
              </div>
              <div className="rounded-xl bg-amber-50 p-3">
                <DollarSign className="size-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">עסקים פעילים</p>
                <p className="mt-1 text-3xl font-bold tabular-nums">
                  {data.totalActiveBusinesses.toLocaleString("he-IL")}
                </p>
              </div>
              <div className="rounded-xl bg-blue-50 p-3">
                <Building2 className="size-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-5 text-slate-600" />
            <CardTitle className="text-lg">חלוקה לפי תוכנית</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-100">
            {data.planDistribution.map((p) => {
              const pct = totalPlans > 0 ? (p.count / totalPlans) * 100 : 0;
              if (pct <= 0) return null;
              return (
                <div
                  key={p.plan}
                  className={`${PLAN_BAR_CLASS[p.plan] ?? "bg-slate-300"} transition-all`}
                  style={{ width: `${pct}%` }}
                  title={`${PLAN_LABELS[p.plan] ?? p.plan}: ${p.count}`}
                />
              );
            })}
          </div>
          <ul className="grid gap-3 sm:grid-cols-3">
            {data.planDistribution.map((p) => {
              const pct = totalPlans > 0 ? Math.round((p.count / totalPlans) * 1000) / 10 : 0;
              return (
                <li
                  key={p.plan}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`size-2.5 shrink-0 rounded-full ${PLAN_BAR_CLASS[p.plan] ?? "bg-slate-300"}`}
                    />
                    <span className="font-medium text-slate-800">
                      {PLAN_LABELS[p.plan] ?? p.plan}
                    </span>
                  </div>
                  <div className="text-left text-sm tabular-nums text-muted-foreground">
                    <span className="font-semibold text-slate-900">{p.count}</span>
                    <span className="mx-1">·</span>
                    <span>{pct}%</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">הכנסות חודשיות (6 חודשים אחרונים)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-56 items-end justify-between gap-2 border-b border-slate-100 pb-2 pt-4 sm:gap-3">
            {data.monthlyRevenue.map((m) => {
              const hPct = maxMonthly > 0 ? (m.amount / maxMonthly) * 100 : 0;
              return (
                <div
                  key={m.period}
                  className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
                >
                  <div className="flex w-full max-w-[3.5rem] flex-col items-center justify-end">
                    <span className="mb-1 text-xs font-medium tabular-nums text-slate-700">
                      ₪{m.amount.toLocaleString("he-IL", { maximumFractionDigits: 0 })}
                    </span>
                    <div className="flex h-40 w-full items-end justify-center rounded-t-md bg-slate-100">
                      <div
                        className="w-full min-h-[4px] rounded-t-md bg-emerald-500 transition-all"
                        style={{ height: `${Math.max(hPct, m.amount > 0 ? 8 : 0)}%` }}
                      />
                    </div>
                  </div>
                  <span className="max-w-full truncate text-center text-[11px] text-muted-foreground sm:text-xs">
                    {formatPeriodHe(m.period)}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
