import Link from "next/link";
import {
  CalendarDays,
  Users,
  Globe,
  MessageSquare,
  Dumbbell,
  CreditCard,
  Check,
  Star,
  TrendingUp,
} from "lucide-react";
import { t } from "@/lib/i18n";

const locale = "he";

const k = (key: string) => key as Parameters<typeof t>[0];

const features = [
  { icon: CalendarDays, label: t(locale, k("auth.feature_calendar")) },
  { icon: Users, label: t(locale, k("auth.feature_crm")) },
  { icon: Globe, label: t(locale, k("auth.feature_site")) },
  { icon: MessageSquare, label: t(locale, k("auth.feature_comms")) },
  { icon: Dumbbell, label: t(locale, k("auth.feature_classes")) },
  { icon: CreditCard, label: t(locale, k("auth.feature_cards")) },
];

function CalendarCard() {
  const days = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳"];
  const hours = ["09:00", "10:00", "11:00", "12:00"];
  const blocks = [
    { day: 0, hour: 0, span: 2, color: "bg-indigo-500/80", label: "יוגה" },
    { day: 1, hour: 1, span: 1, color: "bg-emerald-500/80", label: "פילאטיס" },
    { day: 2, hour: 0, span: 1, color: "bg-violet-500/80", label: "TRX" },
    { day: 3, hour: 2, span: 2, color: "bg-amber-500/80", label: "קרוספיט" },
    { day: 4, hour: 1, span: 1, color: "bg-rose-500/80", label: "אישי" },
    { day: 1, hour: 3, span: 1, color: "bg-sky-500/80", label: "זומבה" },
    { day: 3, hour: 0, span: 1, color: "bg-indigo-500/80", label: "יוגה" },
  ];

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur-xl shadow-2xl shadow-black/20 w-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-medium text-white/40">מרץ 2026</span>
        <span className="text-[11px] font-semibold text-white/70">לוח שיעורים</span>
      </div>
      <div className="grid grid-cols-5 gap-px">
        {days.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-white/40 pb-1.5">
            {d}
          </div>
        ))}
        {hours.map((hour, hi) =>
          days.map((_, di) => {
            const block = blocks.find((b) => b.day === di && b.hour === hi);
            if (block) {
              return (
                <div
                  key={`${di}-${hi}`}
                  className={`${block.color} rounded-md px-1 py-1 text-[9px] font-medium text-white`}
                  style={block.span > 1 ? { gridRow: `span ${block.span}` } : undefined}
                >
                  {block.label}
                </div>
              );
            }
            const covered = blocks.some(
              (b) => b.day === di && b.span > 1 && hi > b.hour && hi < b.hour + b.span
            );
            if (covered) return null;
            return (
              <div
                key={`${di}-${hi}`}
                className="rounded-md border border-white/[0.04] h-7"
              />
            );
          })
        )}
      </div>
    </div>
  );
}

function NotificationCard() {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur-xl shadow-2xl shadow-black/20 w-full">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex size-7 items-center justify-center rounded-full bg-emerald-500/20">
          <Check className="size-3.5 text-emerald-400" />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-white/80">הזמנה אושרה</p>
          <p className="text-[10px] text-white/40">לפני 2 דקות</p>
        </div>
      </div>
      <div className="space-y-2 rounded-xl bg-white/[0.04] p-3">
        <div className="flex justify-between">
          <span className="text-[10px] text-white/40">שירות</span>
          <span className="text-[11px] font-medium text-white/70">אימון אישי</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[10px] text-white/40">תאריך</span>
          <span className="text-[11px] font-medium text-white/70">27.03 | 10:00</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[10px] text-white/40">לקוח</span>
          <span className="text-[11px] font-medium text-white/70">נועה כהן</span>
        </div>
      </div>
    </div>
  );
}

function StatsCard() {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur-xl shadow-2xl shadow-black/20 w-full">
      <div className="flex items-center justify-between mb-3">
        <TrendingUp className="size-3.5 text-emerald-400" />
        <span className="text-[11px] font-semibold text-white/70">סיכום חודשי</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/[0.04] p-2.5 text-center">
          <p className="text-lg font-bold text-white/90">127</p>
          <p className="text-[10px] text-white/40">תורים</p>
        </div>
        <div className="rounded-xl bg-white/[0.04] p-2.5 text-center">
          <p className="text-lg font-bold text-white/90">94%</p>
          <p className="text-[10px] text-white/40">נוכחות</p>
        </div>
        <div className="rounded-xl bg-white/[0.04] p-2.5 text-center">
          <p className="text-lg font-bold text-white/90">43</p>
          <p className="text-[10px] text-white/40">לקוחות חדשים</p>
        </div>
        <div className="rounded-xl bg-white/[0.04] p-2.5 text-center">
          <p className="text-lg font-bold text-white/90">4.9</p>
          <p className="text-[10px] text-white/40 flex items-center justify-center gap-0.5">
            <Star className="size-2.5 fill-amber-400 text-amber-400" />
            דירוג
          </p>
        </div>
      </div>
    </div>
  );
}

function CrmCard() {
  const customers = [
    { name: "נועה כהן", visits: 24, badge: "VIP", color: "bg-amber-500/20 text-amber-400" },
    { name: "יוסי לוי", visits: 12, badge: "פעיל", color: "bg-emerald-500/20 text-emerald-400" },
    { name: "מיכל אברהם", visits: 8, badge: "חדש", color: "bg-sky-500/20 text-sky-400" },
  ];

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur-xl shadow-2xl shadow-black/20 w-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-white/40">3 מתוך 89</span>
        <span className="text-[11px] font-semibold text-white/70">לקוחות</span>
      </div>
      <div className="space-y-2">
        {customers.map((c) => (
          <div key={c.name} className="flex items-center gap-2.5 rounded-xl bg-white/[0.04] px-3 py-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/30 to-violet-500/30 text-[10px] font-bold text-white/70">
              {c.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-white/80 truncate">{c.name}</p>
              <p className="text-[10px] text-white/40">{c.visits} ביקורים</p>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${c.color}`}>
              {c.badge}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AuthLayout({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex min-h-[100dvh]">
      {/* ── Left Panel: Dark Product Showcase (desktop) ── */}
      <div className="relative hidden w-[55%] overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14 bg-[#09090b]">
        {/* Dot grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        {/* Glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-indigo-600/[0.08] blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] rounded-full bg-violet-600/[0.06] blur-[100px]" />

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-white/[0.08] border border-white/[0.06]">
              <CalendarDays className="size-5 text-white/80" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">
              BookIT
            </span>
          </Link>
        </div>

        {/* Center: Headline + Floating Cards */}
        <div className="relative z-10 flex-1 flex flex-col justify-center -mt-8">
          {/* Headline */}
          <div className="mb-10 max-w-md">
            <h2 className="text-[2rem] xl:text-[2.25rem] font-extrabold leading-[1.2] text-white tracking-tight">
              {t(locale, k("auth.showcase_headline"))}
            </h2>
            <p className="mt-4 text-[0.95rem] leading-relaxed text-white/50">
              {t(locale, k("auth.showcase_sub"))}
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mb-10">
            {features.map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3.5 py-1.5"
              >
                <f.icon className="size-3.5 text-indigo-400/70" />
                <span className="text-[12px] font-medium text-white/60">{f.label}</span>
              </div>
            ))}
          </div>

          {/* Product cards - 2x2 grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="animate-[fadeSlideUp_0.7s_ease-out_0.1s_both]">
              <CalendarCard />
            </div>
            <div className="animate-[fadeSlideUp_0.7s_ease-out_0.3s_both]">
              <NotificationCard />
            </div>
            <div className="animate-[fadeSlideUp_0.7s_ease-out_0.5s_both]">
              <StatsCard />
            </div>
            <div className="animate-[fadeSlideUp_0.7s_ease-out_0.7s_both]">
              <CrmCard />
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile: Dark Header Strip ── */}
      <div className="relative flex flex-col items-center justify-center overflow-hidden bg-[#09090b] px-6 py-10 lg:hidden">
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] rounded-full bg-indigo-600/[0.1] blur-[80px]" />

        <Link href="/" className="relative z-10 inline-flex items-center gap-2.5 mb-4">
          <div className="flex size-9 items-center justify-center rounded-xl bg-white/[0.08] border border-white/[0.06]">
            <CalendarDays className="size-5 text-white/80" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">BookIT</span>
        </Link>
        <p className="relative z-10 text-sm text-white/40 text-center max-w-[260px]">
          {t(locale, k("auth.showcase_sub"))}
        </p>
      </div>

      {/* ── Right Panel: Form ── */}
      <div className="relative flex w-full flex-col lg:w-[45%]">
        <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-10 lg:px-14 xl:px-20">
          <div className="mx-auto w-full max-w-[400px]">
            <div className="mb-8">
              <h1 className="text-[1.65rem] font-bold tracking-tight text-gray-900">
                {title}
              </h1>
              <p className="mt-2 text-[0.9rem] leading-relaxed text-gray-500">
                {subtitle}
              </p>
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
