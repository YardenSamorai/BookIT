import {
  CalendarDays,
  Users,
  Scissors,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  UserPlus,
  BarChart3,
  ArrowRight,
  Sparkles,
  PaintBucket,
  UserCog,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireBusinessOwner } from "@/lib/auth/guards";
import { getBusinessLocale } from "@/lib/db/queries/business";
import { getDashboardData } from "@/lib/db/queries/dashboard";
import { t } from "@/lib/i18n";

function formatCurrency(amount: number, currency: string) {
  const symbols: Record<string, string> = { ILS: "₪", USD: "$", EUR: "€", GBP: "£" };
  const symbol = symbols[currency] ?? currency;
  return `${symbol}${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function StatusBadge({ status, locale }: { status: string; locale: "en" | "he" }) {
  const map: Record<string, { label: string; classes: string }> = {
    CONFIRMED: {
      label: t(locale, "dash.status_confirmed"),
      classes: "bg-blue-50 text-blue-700 ring-blue-600/20",
    },
    PENDING: {
      label: t(locale, "dash.status_pending"),
      classes: "bg-amber-50 text-amber-700 ring-amber-600/20",
    },
    COMPLETED: {
      label: t(locale, "dash.status_completed"),
      classes: "bg-green-50 text-green-700 ring-green-600/20",
    },
    CANCELLED: {
      label: t(locale, "dash.status_cancelled"),
      classes: "bg-red-50 text-red-700 ring-red-600/20",
    },
    NO_SHOW: {
      label: t(locale, "dash.status_no_show"),
      classes: "bg-gray-50 text-gray-700 ring-gray-600/20",
    },
  };
  const info = map[status] ?? map.PENDING;
  return (
    <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset sm:px-2 sm:text-xs ${info.classes}`}>
      {info.label}
    </span>
  );
}

export default async function DashboardOverviewPage() {
  const { businessId } = await requireBusinessOwner();
  const [locale, data] = await Promise.all([
    getBusinessLocale(businessId),
    getDashboardData(businessId),
  ]);

  const { stats, staffPerformance, popularServices, recentAppointments, currency } = data;
  const dateLocale = locale === "he" ? "he-IL" : "en-US";

  return (
    <div className="space-y-8">
      <PageHeader
        title={t(locale, "dash.overview")}
        description={t(locale, "dash.welcome")}
      />

      {/* ── Top Stats Grid ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-s-4 border-s-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t(locale, "dash.today_appointments")}
            </CardTitle>
            <CalendarDays className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.todayCount}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {t(locale, "dash.avg_per_day")}: {stats.avgPerDay}
            </p>
          </CardContent>
        </Card>

        <Card className="border-s-4 border-s-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t(locale, "dash.revenue_month")}
            </CardTitle>
            <TrendingUp className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(stats.monthRevenue, currency)}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {t(locale, "dash.total_revenue")}: {formatCurrency(stats.totalRevenue, currency)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-s-4 border-s-violet-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t(locale, "dash.customers")}
            </CardTitle>
            <Users className="size-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalCustomers}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              +{stats.newCustomersMonth} {t(locale, "dash.new_customers_month")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-s-4 border-s-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t(locale, "dash.month_appointments")}
            </CardTitle>
            <BarChart3 className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.monthCount}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {t(locale, "dash.total_appointments")}: {stats.totalCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Status Breakdown ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="flex items-center gap-3 pt-4">
            <div className="flex size-10 items-center justify-center rounded-full bg-amber-100">
              <Clock className="size-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700">{stats.pendingCount}</p>
              <p className="text-xs text-amber-600/80">{t(locale, "dash.pending_appointments")}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white">
          <CardContent className="flex items-center gap-3 pt-4">
            <div className="flex size-10 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="size-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{stats.completedCount}</p>
              <p className="text-xs text-green-600/80">{t(locale, "dash.completed")}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-white">
          <CardContent className="flex items-center gap-3 pt-4">
            <div className="flex size-10 items-center justify-center rounded-full bg-red-100">
              <XCircle className="size-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-700">{stats.cancelledCount}</p>
              <p className="text-xs text-red-600/80">{t(locale, "dash.cancelled")}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="flex items-center gap-3 pt-4">
            <div className="flex size-10 items-center justify-center rounded-full bg-blue-100">
              <Scissors className="size-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{stats.activeServices}</p>
              <p className="text-xs text-blue-600/80">{t(locale, "dash.active_services")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Main Content: Two Columns ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Staff Performance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCog className="size-4" />
              {t(locale, "dash.staff_performance")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {staffPerformance.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t(locale, "dash.no_data_yet")}
              </p>
            ) : (
              <div className="space-y-4">
                {staffPerformance.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-sm font-bold text-gray-600">
                      {member.imageUrl ? (
                        <img
                          src={member.imageUrl}
                          alt={member.name}
                          className="size-10 rounded-full object-cover"
                        />
                      ) : (
                        member.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-sm font-medium">{member.name}</p>
                        <p className="shrink-0 text-sm font-semibold">
                          {formatCurrency(member.revenue, currency)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">{member.role ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.appointmentsCount} {t(locale, "dash.appointments_count")}
                        </p>
                      </div>
                      {stats.totalCount > 0 && (
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all"
                            style={{
                              width: `${Math.min(100, Math.round((member.appointmentsCount / stats.totalCount) * 100))}%`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Popular Services */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4" />
              {t(locale, "dash.popular_services")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {popularServices.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t(locale, "dash.no_data_yet")}
              </p>
            ) : (
              <div className="space-y-4">
                {popularServices.slice(0, 6).map((svc, idx) => (
                  <div key={svc.id} className="flex items-center gap-3">
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white ${
                        idx === 0
                          ? "bg-gradient-to-br from-amber-400 to-orange-500"
                          : idx === 1
                            ? "bg-gradient-to-br from-gray-300 to-gray-400"
                            : idx === 2
                              ? "bg-gradient-to-br from-amber-600 to-amber-700"
                              : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-sm font-medium">{svc.title}</p>
                        <p className="shrink-0 text-xs text-muted-foreground">
                          {svc.count} {t(locale, "dash.bookings_count")}
                        </p>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all"
                          style={{
                            width: `${Math.max(4, svc.percentage)}%`,
                          }}
                        />
                      </div>
                      <p className="mt-0.5 text-end text-[10px] text-muted-foreground">
                        {svc.percentage}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Appointments ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="size-4" />
            {t(locale, "dash.recent_appointments")}
          </CardTitle>
          <Link
            href="/dashboard/appointments"
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            {t(locale, "dash.view_appointments")}
            <ArrowRight className="size-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentAppointments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t(locale, "dash.no_recent")}
            </p>
          ) : (
            <div className="-mx-2 overflow-x-auto sm:mx-0">
              <table className="w-full text-[11px] sm:text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="whitespace-nowrap py-1.5 pe-2 text-start font-medium sm:py-2 sm:pe-4">{t(locale, "dash.service_name")}</th>
                    <th className="whitespace-nowrap py-1.5 pe-2 text-start font-medium sm:py-2 sm:pe-4">{t(locale, "dash.staff_name")}</th>
                    <th className="whitespace-nowrap py-1.5 pe-2 text-start font-medium sm:py-2 sm:pe-4">{t(locale, "dash.date")}</th>
                    <th className="whitespace-nowrap py-1.5 pe-2 text-start font-medium sm:py-2 sm:pe-4">{t(locale, "dash.revenue")}</th>
                    <th className="whitespace-nowrap py-1.5 text-start font-medium sm:py-2">{t(locale, "dash.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAppointments.map((apt) => {
                    const d = new Date(apt.startTime);
                    return (
                      <tr key={apt.id} className="border-b last:border-0">
                        <td className="whitespace-nowrap py-2 pe-2 font-medium sm:py-2.5 sm:pe-4">{apt.serviceName}</td>
                        <td className="whitespace-nowrap py-2 pe-2 text-muted-foreground sm:py-2.5 sm:pe-4">{apt.staffName}</td>
                        <td className="whitespace-nowrap py-2 pe-2 text-muted-foreground sm:py-2.5 sm:pe-4">
                          <span className="sm:hidden">
                            {d.toLocaleDateString(dateLocale, { day: "numeric", month: "short" })}{", "}
                            {d.toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className="hidden sm:inline">
                            {d.toLocaleDateString(dateLocale, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </td>
                        <td className="whitespace-nowrap py-2 pe-2 sm:py-2.5 sm:pe-4">
                          {apt.paymentAmount
                            ? formatCurrency(parseFloat(apt.paymentAmount), currency)
                            : "—"}
                        </td>
                        <td className="whitespace-nowrap py-2 sm:py-2.5">
                          <StatusBadge status={apt.status} locale={locale} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Quick Actions ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t(locale, "dash.quick_actions")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/dashboard/services"
              className="flex items-center gap-3 rounded-xl border p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50">
                <Scissors className="size-5 text-blue-600" />
              </div>
              <span className="text-sm font-medium">{t(locale, "dash.add_service")}</span>
            </Link>

            <Link
              href="/dashboard/staff"
              className="flex items-center gap-3 rounded-xl border p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-violet-50">
                <UserPlus className="size-5 text-violet-600" />
              </div>
              <span className="text-sm font-medium">{t(locale, "dash.add_staff")}</span>
            </Link>

            <Link
              href="/dashboard/site-editor"
              className="flex items-center gap-3 rounded-xl border p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50">
                <PaintBucket className="size-5 text-emerald-600" />
              </div>
              <span className="text-sm font-medium">{t(locale, "dash.edit_site")}</span>
            </Link>

            <Link
              href="/dashboard/appointments"
              className="flex items-center gap-3 rounded-xl border p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-50">
                <ClipboardList className="size-5 text-amber-600" />
              </div>
              <span className="text-sm font-medium">{t(locale, "dash.view_appointments")}</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
