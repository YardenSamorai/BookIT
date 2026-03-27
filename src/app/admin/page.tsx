import {
  Building2,
  DollarSign,
  MessageSquare,
  UserPlus,
  AlertTriangle,
  TrendingUp,
  TicketCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  getAdminDashboardStats,
  getBusinessesNeedingAttention,
  getAdminBusinessList,
} from "@/actions/admin";
import { getTicketStats } from "@/actions/tickets";

export default async function AdminDashboardPage() {
  const [stats, attention, allBiz, ticketStats] = await Promise.all([
    getAdminDashboardStats(),
    getBusinessesNeedingAttention(),
    getAdminBusinessList(),
    getTicketStats(),
  ]);

  const topConsumers = [...allBiz]
    .sort((a, b) => b.messages.sent - a.messages.sent)
    .slice(0, 5);

  const recentSignups = [...allBiz]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">דשבורד ניהול</h1>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">סה&quot;כ עסקים</p>
                <p className="mt-1 text-3xl font-bold">{stats.businesses.total}</p>
                <div className="mt-2 flex gap-2 text-xs">
                  <span className="text-emerald-600">{stats.businesses.active} פעילים</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-amber-600">{stats.businesses.trial} ניסיון</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-red-500">{stats.businesses.cancelled} מבוטלים</span>
                </div>
              </div>
              <div className="rounded-xl bg-blue-50 p-3">
                <Building2 className="size-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">הכנסה חודשית</p>
                <p className="mt-1 text-3xl font-bold">₪{stats.revenue.toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3">
                <DollarSign className="size-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">הודעות החודש</p>
                <p className="mt-1 text-3xl font-bold">{stats.messages.total.toLocaleString()}</p>
                <div className="mt-2 flex gap-2 text-xs">
                  <span className="text-green-600">WA: {stats.messages.whatsapp}</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-blue-600">SMS: {stats.messages.sms}</span>
                </div>
              </div>
              <div className="rounded-xl bg-green-50 p-3">
                <MessageSquare className="size-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">נרשמו (30 יום)</p>
                <p className="mt-1 text-3xl font-bold">{stats.newSignups}</p>
              </div>
              <div className="rounded-xl bg-violet-50 p-3">
                <UserPlus className="size-5 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Needs attention */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-amber-500" />
              דורש תשומת לב
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attention.overdue.length === 0 && ticketStats.open === 0 ? (
              <p className="text-sm text-muted-foreground">הכל תקין, אין פריטים שדורשים תשומת לב.</p>
            ) : (
              <div className="space-y-2">
                {ticketStats.open > 0 && (
                  <Link
                    href="/admin/tickets"
                    className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 transition-colors hover:bg-amber-100"
                  >
                    <div className="flex items-center gap-2">
                      <TicketCheck className="size-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-800">
                        {ticketStats.open} טיקטים פתוחים
                      </span>
                    </div>
                    <Badge className="bg-amber-600 text-xs">
                      לטיפול
                    </Badge>
                  </Link>
                )}
                {attention.overdue.map((item) => (
                  <Link
                    key={item.id}
                    href={`/admin/businesses/${item.businessId}`}
                    className="flex items-center justify-between rounded-lg border px-3 py-2 transition-colors hover:bg-slate-50"
                  >
                    <div>
                      <span className="text-sm font-medium">{item.businessName}</span>
                      <span className="mr-2 text-xs text-muted-foreground">{item.periodLabel}</span>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      חוב ₪{(item.amountIls / 100).toFixed(0)}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top message consumers */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-4 text-blue-500" />
              צרכני הודעות מובילים
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topConsumers.length === 0 ? (
              <p className="text-sm text-muted-foreground">אין נתונים עדיין.</p>
            ) : (
              <div className="space-y-2">
                {topConsumers.map((biz) => {
                  const pct = biz.messages.quota > 0
                    ? Math.min(100, Math.round((biz.messages.sent / biz.messages.quota) * 100))
                    : 0;
                  return (
                    <Link
                      key={biz.id}
                      href={`/admin/businesses/${biz.id}`}
                      className="flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors hover:bg-slate-50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{biz.name}</p>
                        <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full transition-all ${
                              pct >= 80 ? "bg-red-500" : pct >= 50 ? "bg-amber-400" : "bg-emerald-500"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {biz.messages.sent}/{biz.messages.quota}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent signups */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">נרשמו לאחרונה</CardTitle>
        </CardHeader>
        <CardContent>
          {recentSignups.length === 0 ? (
            <p className="text-sm text-muted-foreground">אין עסקים עדיין.</p>
          ) : (
            <div className="divide-y">
              {recentSignups.map((biz) => (
                <Link
                  key={biz.id}
                  href={`/admin/businesses/${biz.id}`}
                  className="flex items-center justify-between py-2.5 transition-colors hover:bg-slate-50 rounded px-2 -mx-2"
                >
                  <div>
                    <p className="text-sm font-medium">{biz.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {biz.owner?.name} · {biz.owner?.phone || biz.owner?.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <PlanBadge plan={biz.plan} />
                    <span className="text-xs text-muted-foreground">
                      {new Date(biz.createdAt).toLocaleDateString("he-IL")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const styles: Record<string, string> = {
    FREE: "bg-slate-100 text-slate-600",
    STARTER: "bg-blue-100 text-blue-700",
    PRO: "bg-violet-100 text-violet-700",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${styles[plan] ?? styles.FREE}`}>
      {plan}
    </span>
  );
}
