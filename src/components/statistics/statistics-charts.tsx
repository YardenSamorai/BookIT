"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Users,
  Star,
  XCircle,
  DollarSign,
  UserPlus,
  Clock,
  Activity,
  Percent,
  Hash,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useT } from "@/lib/i18n/locale-context";
import { getDir, DAYS_SHORT_KEYS, type Locale } from "@/lib/i18n";

type StatisticsData = {
  currency: string;
  kpis: {
    totalAppointments: number;
    thisMonthAppointments: number;
    totalRevenue: number;
    thisMonthRevenue: number;
    totalCustomers: number;
    newCustomersThisMonth: number;
    avgRating: number;
    totalReviews: number;
    cancellationRate: number;
  };
  revenueByMonth: { month: string; revenue: number; count: number }[];
  appointmentsByDay: { date: string; count: number }[];
  statusBreakdown: {
    confirmed: number;
    completed: number;
    cancelled: number;
    pending: number;
    noShow: number;
  };
  topServices: { id: string; title: string; count: number; revenue: number }[];
  staffPerformance: { name: string; count: number; revenue: number; hours: number }[];
  dayOfWeekCounts: number[];
  hourCounts: number[];
  sourceBreakdown: { online: number; dashboard: number; walkIn: number };
  customerGrowth: { month: string; count: number }[];
  ratingDist: number[];
};

const PALETTE = {
  indigo: "#6366f1",
  violet: "#8b5cf6",
  purple: "#a78bfa",
  lavender: "#c4b5fd",
  blue: "#3b82f6",
  green: "#22c55e",
  emerald: "#10b981",
  amber: "#f59e0b",
  red: "#ef4444",
  gray: "#6b7280",
};

const CHART_COLORS = [
  PALETTE.indigo, PALETTE.violet, PALETTE.blue, PALETTE.emerald,
  PALETTE.amber, PALETTE.purple, PALETTE.red, PALETTE.lavender,
];

const STATUS_COLORS: Record<string, string> = {
  confirmed: PALETTE.blue,
  completed: PALETTE.green,
  cancelled: PALETTE.red,
  pending: PALETTE.amber,
  noShow: PALETTE.gray,
};

const SOURCE_COLORS = [PALETTE.indigo, PALETTE.violet, PALETTE.lavender];

function fmtCurrency(amount: number, currency: string) {
  const symbols: Record<string, string> = { ILS: "₪", USD: "$", EUR: "€", GBP: "£" };
  const symbol = symbols[currency] ?? currency;
  return `${symbol}${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function fmtMonth(month: string, locale: string) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString(locale === "he" ? "he-IL" : "en-US", { month: "short" });
}

function fmtDay(date: string) {
  const [, , d] = date.split("-").map(Number);
  return String(d);
}

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  trend?: { value: number; label: string };
}) {
  return (
    <Card className="relative overflow-hidden border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-[13px] font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-[12px] text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1">
                {trend.value >= 0 ? (
                  <TrendingUp className="size-3.5 text-emerald-500" />
                ) : (
                  <TrendingDown className="size-3.5 text-red-500" />
                )}
                <span className={`text-[12px] font-semibold ${trend.value >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {trend.value >= 0 ? "+" : ""}{trend.value}%
                </span>
                <span className="text-[11px] text-muted-foreground">{trend.label}</span>
              </div>
            )}
          </div>
          <div
            className="flex size-12 shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${color}12` }}
          >
            <Icon className="size-6" style={{ color }} />
          </div>
        </div>
        <div
          className="absolute inset-x-0 bottom-0 h-1 opacity-80"
          style={{ background: `linear-gradient(90deg, ${color}, ${color}44)` }}
        />
      </CardContent>
    </Card>
  );
}

function ChartCard({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={`border-0 shadow-sm ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-[15px] font-semibold">{title}</CardTitle>
        {description && <CardDescription className="text-[12px]">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div dir="ltr">{children}</div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <span className="ms-auto text-[13px] font-bold">{value}</span>
    </div>
  );
}

const TOOLTIP_STYLE = {
  contentStyle: {
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
    fontSize: "13px",
    padding: "10px 14px",
  },
};

export function StatisticsCharts({
  data,
  locale,
}: {
  data: StatisticsData;
  locale: Locale;
}) {
  const t = useT();

  const { kpis, currency } = data;

  const monthLabel = (month: string) => fmtMonth(month, locale);

  const totalAptsAllStatuses = useMemo(
    () => Object.values(data.statusBreakdown).reduce((a, b) => a + b, 0),
    [data.statusBreakdown]
  );

  const statusData = useMemo(
    () =>
      Object.entries(data.statusBreakdown)
        .filter(([, v]) => v > 0)
        .map(([key, value]) => ({
          name: t(`stats.${key}` as Parameters<typeof t>[0]),
          value,
          pct: totalAptsAllStatuses > 0 ? Math.round((value / totalAptsAllStatuses) * 100) : 0,
          color: STATUS_COLORS[key] ?? PALETTE.gray,
        })),
    [data.statusBreakdown, t, totalAptsAllStatuses]
  );

  const sourceData = useMemo(
    () => [
      { name: t("stats.online"), value: data.sourceBreakdown.online },
      { name: t("stats.manual"), value: data.sourceBreakdown.dashboard },
      { name: t("stats.walk_in"), value: data.sourceBreakdown.walkIn },
    ].filter((d) => d.value > 0),
    [data.sourceBreakdown, t]
  );

  const dayData = useMemo(
    () =>
      data.dayOfWeekCounts.map((count, i) => ({
        name: t(DAYS_SHORT_KEYS[i] as Parameters<typeof t>[0]),
        count,
      })),
    [data.dayOfWeekCounts, t]
  );

  const hourData = useMemo(() => {
    const minH = data.hourCounts.findIndex((c) => c > 0);
    const maxH = data.hourCounts.length - 1 - [...data.hourCounts].reverse().findIndex((c) => c > 0);
    if (minH < 0) return [];
    const start = Math.max(0, minH - 1);
    const end = Math.min(23, maxH + 1);
    return data.hourCounts
      .map((count, h) => ({ hour: `${String(h).padStart(2, "0")}:00`, count }))
      .slice(start, end + 1);
  }, [data.hourCounts]);

  const revenueData = data.revenueByMonth.map((d) => ({
    ...d,
    label: monthLabel(d.month),
  }));

  const appointmentDayData = data.appointmentsByDay.map((d) => ({
    ...d,
    label: fmtDay(d.date),
  }));

  const customerGrowthData = data.customerGrowth.map((d) => ({
    ...d,
    label: monthLabel(d.month),
  }));

  const ratingData = data.ratingDist.map((count, i) => ({
    name: `${i + 1}★`,
    count,
  }));

  const peakDay = useMemo(() => {
    let max = 0, idx = 0;
    data.dayOfWeekCounts.forEach((c, i) => { if (c > max) { max = c; idx = i; } });
    return { name: t(DAYS_SHORT_KEYS[idx] as Parameters<typeof t>[0]), count: max };
  }, [data.dayOfWeekCounts, t]);

  const peakHour = useMemo(() => {
    let max = 0, idx = 0;
    data.hourCounts.forEach((c, i) => { if (c > max) { max = c; idx = i; } });
    return { hour: `${String(idx).padStart(2, "0")}:00`, count: max };
  }, [data.hourCounts]);

  return (
    <div className="space-y-6">
      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          title={t("stats.this_month_revenue")}
          value={fmtCurrency(kpis.thisMonthRevenue, currency)}
          subtitle={`${t("stats.total_revenue")}: ${fmtCurrency(kpis.totalRevenue, currency)}`}
          icon={DollarSign}
          color={PALETTE.indigo}
        />
        <KpiCard
          title={t("stats.this_month_appointments")}
          value={kpis.thisMonthAppointments}
          subtitle={`${t("stats.total_appointments")}: ${kpis.totalAppointments}`}
          icon={CalendarDays}
          color={PALETTE.violet}
        />
        <KpiCard
          title={t("stats.total_customers")}
          value={kpis.totalCustomers}
          subtitle={`${t("stats.new_customers")}: +${kpis.newCustomersThisMonth}`}
          icon={Users}
          color={PALETTE.green}
        />
        <KpiCard
          title={t("stats.avg_rating")}
          value={kpis.avgRating > 0 ? `${kpis.avgRating} / 5` : "—"}
          subtitle={`${kpis.totalReviews} ${t("stats.appointments").toLowerCase()}`}
          icon={Star}
          color={PALETTE.amber}
        />
      </div>

      {/* ── Revenue + Appointments over time ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={t("stats.revenue_over_time")} description={`${t("stats.total_revenue")}: ${fmtCurrency(kpis.totalRevenue, currency)}`}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PALETTE.indigo} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={PALETTE.indigo} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} dy={8} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => fmtCurrency(v, currency)} width={65} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(value: any) => [fmtCurrency(Number(value), currency), t("stats.revenue")]} />
                <Area type="monotone" dataKey="revenue" stroke={PALETTE.indigo} strokeWidth={2.5} fill="url(#revGrad)" dot={{ fill: PALETTE.indigo, r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: PALETTE.indigo }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title={t("stats.appointments_per_day")}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={appointmentDayData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" fontSize={10} tickLine={false} axisLine={false} dy={4} interval="preserveStartEnd" />
                <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(value: any) => [value, t("stats.appointments")]} />
                <Bar dataKey="count" fill={PALETTE.violet} radius={[3, 3, 0, 0]} maxBarSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* ── Status breakdown + Source + Cancellation ── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ChartCard title={t("stats.status_breakdown")}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="mx-auto h-48 w-48 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value" nameKey="name" strokeWidth={0}>
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip {...TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2.5">
              {statusData.map((s) => (
                <div key={s.name} className="flex items-center gap-2.5">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="flex-1 text-[13px]">{s.name}</span>
                  <span className="text-[13px] font-bold tabular-nums">{s.value}</span>
                  <span className="w-10 text-end text-[11px] tabular-nums text-muted-foreground">{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        <ChartCard title={t("stats.booking_source")}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="mx-auto h-48 w-48 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sourceData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value" nameKey="name" strokeWidth={0}>
                    {sourceData.map((_, i) => (
                      <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2.5">
              {sourceData.map((s, i) => {
                const total = sourceData.reduce((a, b) => a + b.value, 0);
                const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
                return (
                  <div key={s.name} className="flex items-center gap-2.5">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: SOURCE_COLORS[i] }} />
                    <span className="flex-1 text-[13px]">{s.name}</span>
                    <span className="text-[13px] font-bold tabular-nums">{s.value}</span>
                    <span className="w-10 text-end text-[11px] tabular-nums text-muted-foreground">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </ChartCard>

        <ChartCard title={t("stats.cancellation_rate")}>
          <div className="flex h-52 flex-col items-center justify-center gap-4">
            <div className="relative flex size-36 items-center justify-center">
              <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke={kpis.cancellationRate > 20 ? PALETTE.red : kpis.cancellationRate > 10 ? PALETTE.amber : PALETTE.green}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${(kpis.cancellationRate / 100) * 251} 251`}
                  style={{ transition: "stroke-dasharray 0.6s ease" }}
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-3xl font-bold">{kpis.cancellationRate}%</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <XCircle className="size-4 text-red-400" />
              <span>{t("stats.cancelled")}: {data.statusBreakdown.cancelled}</span>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* ── Top Services + Staff Performance ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={t("stats.top_services")}>
          <div className="space-y-3">
            {data.topServices.map((svc, i) => {
              const maxRev = data.topServices[0]?.revenue || 1;
              const pct = Math.round((svc.revenue / maxRev) * 100);
              return (
                <div key={svc.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium">{svc.title}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[12px] tabular-nums text-muted-foreground">{svc.count} {t("stats.appointments").toLowerCase()}</span>
                      <span className="text-[13px] font-bold tabular-nums">{fmtCurrency(svc.revenue, currency)}</span>
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                  </div>
                </div>
              );
            })}
            {data.topServices.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">—</p>
            )}
          </div>
        </ChartCard>

        <ChartCard title={t("stats.staff_performance")}>
          <div className="space-y-3">
            {data.staffPerformance.map((stf, i) => {
              const maxCount = data.staffPerformance[0]?.count || 1;
              const pct = Math.round((stf.count / maxCount) * 100);
              return (
                <div key={stf.name} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium">{stf.name}</span>
                    <div className="flex items-center gap-3 text-[12px] tabular-nums">
                      <span className="text-muted-foreground">{stf.count} {t("stats.appointments").toLowerCase()}</span>
                      <span className="text-muted-foreground">{stf.hours}h</span>
                      <span className="font-bold">{fmtCurrency(stf.revenue, currency)}</span>
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                  </div>
                </div>
              );
            })}
            {data.staffPerformance.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">—</p>
            )}
          </div>
        </ChartCard>
      </div>

      {/* ── Busiest Days + Hours ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title={t("stats.busiest_days")}
          description={`${t("stats.completed")}: ${peakDay.name} (${peakDay.count})`}
        >
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} dy={4} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(value: any) => [value, t("stats.appointments")]} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={36}>
                  {dayData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title={t("stats.busiest_hours")}
          description={`${t("stats.completed")}: ${peakHour.hour} (${peakHour.count})`}
        >
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="hourGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PALETTE.violet} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={PALETTE.violet} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="hour" fontSize={11} tickLine={false} axisLine={false} dy={4} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(value: any) => [value, t("stats.appointments")]} />
                <Area type="monotone" dataKey="count" stroke={PALETTE.violet} strokeWidth={2.5} fill="url(#hourGrad)" dot={{ fill: PALETTE.violet, r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: PALETTE.violet }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* ── Customer Growth + Rating Distribution ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title={t("stats.customer_growth")}
          description={`${t("stats.new_customers")}: +${kpis.newCustomersThisMonth}`}
        >
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={customerGrowthData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} dy={4} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(value: any) => [value, t("stats.customers")]} />
                <Line type="monotone" dataKey="count" stroke={PALETTE.green} strokeWidth={2.5} dot={{ fill: PALETTE.green, r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: PALETTE.green }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title={t("stats.rating_distribution")}>
          <div className="space-y-3">
            {ratingData.map((r, i) => {
              const maxCount = Math.max(...ratingData.map((d) => d.count), 1);
              const pct = Math.round((r.count / maxCount) * 100);
              const colors = [PALETTE.red, "#f97316", PALETTE.amber, "#84cc16", PALETTE.green];
              return (
                <div key={r.name} className="flex items-center gap-3">
                  <span className="w-8 text-[13px] font-medium">{r.name}</span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: colors[i] }}
                    />
                  </div>
                  <span className="w-8 text-end text-[13px] font-bold tabular-nums">{r.count}</span>
                </div>
              );
            })}
            {kpis.avgRating > 0 && (
              <div className="flex items-center justify-center gap-2 rounded-lg bg-amber-50 px-3 py-2.5">
                <Star className="size-5 fill-amber-400 text-amber-400" />
                <span className="text-lg font-bold text-amber-700">{kpis.avgRating}</span>
                <span className="text-[13px] text-amber-600">/ 5</span>
                <span className="text-[12px] text-amber-500">({kpis.totalReviews})</span>
              </div>
            )}
          </div>
        </ChartCard>
      </div>

      {/* ── Quick Stats Summary ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-50">
              <Activity className="size-5 text-indigo-500" />
            </div>
            <div>
              <p className="text-[12px] text-muted-foreground">{t("stats.busiest_days")}</p>
              <p className="text-[15px] font-bold">{peakDay.name} ({peakDay.count})</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 items-center justify-center rounded-xl bg-violet-50">
              <Clock className="size-5 text-violet-500" />
            </div>
            <div>
              <p className="text-[12px] text-muted-foreground">{t("stats.busiest_hours")}</p>
              <p className="text-[15px] font-bold">{peakHour.hour} ({peakHour.count})</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50">
              <UserPlus className="size-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-[12px] text-muted-foreground">{t("stats.new_customers")}</p>
              <p className="text-[15px] font-bold">+{kpis.newCustomersThisMonth}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 items-center justify-center rounded-xl bg-red-50">
              <Percent className="size-5 text-red-500" />
            </div>
            <div>
              <p className="text-[12px] text-muted-foreground">{t("stats.cancellation_rate")}</p>
              <p className="text-[15px] font-bold">{kpis.cancellationRate}%</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
