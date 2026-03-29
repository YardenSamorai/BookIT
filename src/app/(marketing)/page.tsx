import Link from "next/link";
import {
  CalendarDays,
  Globe,
  Users,
  MessageCircle,
  Dumbbell,
  CreditCard,
  ArrowLeft,
  ArrowRight,
  Check,
  Paintbrush,
  Phone,
  BarChart3,
  UserCheck,
  Layers,
  Smartphone,
  HeartHandshake,
  TrendingUp,
  Star,
  Quote,
  Sparkles,
} from "lucide-react";
import { t, isRtl, type Locale } from "@/lib/i18n";
import { MobileNav } from "./components/mobile-nav";
import { StickyMobileCta } from "./components/sticky-mobile-cta";
import { ContactForm } from "./components/contact-form";
import { CompareTable } from "./components/compare-table";
import {
  DashboardMockup,
  SiteMockup,
  CrmMockup,
  WhatsAppMockup,
  OpsMockup,
} from "./components/dashboard-mockup";

const LOCALE: Locale = "he";

function T(key: string): string {
  return t(LOCALE, key as never);
}

const ArrowIcon = isRtl(LOCALE) ? ArrowLeft : ArrowRight;

const featureBlocks = [
  {
    titleKey: "landing.feat_site_title",
    descKey: "landing.feat_site_desc",
    bullets: ["landing.feat_site_1", "landing.feat_site_2", "landing.feat_site_3", "landing.feat_site_4"],
    icon: Paintbrush,
    gradient: "from-blue-500 to-indigo-600",
    mockup: "site" as const,
  },
  {
    titleKey: "landing.feat_crm_title",
    descKey: "landing.feat_crm_desc",
    bullets: ["landing.feat_crm_1", "landing.feat_crm_2", "landing.feat_crm_3", "landing.feat_crm_4"],
    icon: UserCheck,
    gradient: "from-emerald-500 to-teal-600",
    mockup: "crm" as const,
  },
  {
    titleKey: "landing.feat_wa_title",
    descKey: "landing.feat_wa_desc",
    bullets: ["landing.feat_wa_1", "landing.feat_wa_2", "landing.feat_wa_3", "landing.feat_wa_4"],
    icon: MessageCircle,
    gradient: "from-green-500 to-emerald-600",
    mockup: "whatsapp" as const,
  },
  {
    titleKey: "landing.feat_ops_title",
    descKey: "landing.feat_ops_desc",
    bullets: ["landing.feat_ops_1", "landing.feat_ops_2", "landing.feat_ops_3", "landing.feat_ops_4"],
    icon: CalendarDays,
    gradient: "from-violet-500 to-purple-600",
    mockup: "ops" as const,
  },
];

const mockupComponents = {
  site: SiteMockup,
  crm: CrmMockup,
  whatsapp: WhatsAppMockup,
  ops: OpsMockup,
};

const differentiators = [
  { titleKey: "landing.why1_title", descKey: "landing.why1_desc", icon: Layers, gradient: "from-violet-500 to-purple-600" },
  { titleKey: "landing.why2_title", descKey: "landing.why2_desc", icon: Phone, gradient: "from-green-500 to-emerald-600" },
  { titleKey: "landing.why3_title", descKey: "landing.why3_desc", icon: CalendarDays, gradient: "from-blue-500 to-indigo-600" },
  { titleKey: "landing.why4_title", descKey: "landing.why4_desc", icon: Smartphone, gradient: "from-orange-500 to-amber-600" },
  { titleKey: "landing.why5_title", descKey: "landing.why5_desc", icon: HeartHandshake, gradient: "from-pink-500 to-rose-600" },
  { titleKey: "landing.why6_title", descKey: "landing.why6_desc", icon: TrendingUp, gradient: "from-cyan-500 to-blue-600" },
];

const testimonials = [
  { nameKey: "landing.testimonial1_name", textKey: "landing.testimonial1_text", stars: 5 },
  { nameKey: "landing.testimonial2_name", textKey: "landing.testimonial2_text", stars: 5 },
  { nameKey: "landing.testimonial3_name", textKey: "landing.testimonial3_text", stars: 5 },
  { nameKey: "landing.testimonial4_name", textKey: "landing.testimonial4_text", stars: 5 },
];

const steps = [
  { num: "1", titleKey: "landing.how_step1_title", descKey: "landing.how_step1_desc" },
  { num: "2", titleKey: "landing.how_step2_title", descKey: "landing.how_step2_desc" },
  { num: "3", titleKey: "landing.how_step3_title", descKey: "landing.how_step3_desc" },
];

const starterFeatures = [
  t(LOCALE, "landing.plan_staff" as never).replace("{count}", "3"),
  t(LOCALE, "landing.plan_services" as never).replace("{count}", "15"),
  t(LOCALE, "landing.plan_bookings" as never).replace("{count}", "150"),
  t(LOCALE, "landing.plan_cards" as never).replace("{count}", "5"),
  T("landing.plan_themes_basic"),
];

const proFeatures = [
  T("landing.plan_staff_unlimited"),
  T("landing.plan_services_unlimited"),
  T("landing.plan_bookings_unlimited"),
  T("landing.plan_cards_unlimited"),
  T("landing.plan_themes_all"),
  T("landing.plan_branding"),
  T("landing.plan_subdomain"),
];

const allPlansInclude = [
  { key: "landing.plan_includes_site", icon: Globe },
  { key: "landing.plan_includes_crm", icon: Users },
  { key: "landing.plan_includes_wa", icon: MessageCircle },
  { key: "landing.plan_includes_classes", icon: Dumbbell },
  { key: "landing.plan_includes_analytics", icon: BarChart3 },
  { key: "landing.plan_includes_cards", icon: CreditCard },
];

const proofItems = [
  { icon: Globe, key: "landing.proof_site" },
  { icon: Users, key: "landing.proof_crm" },
  { icon: MessageCircle, key: "landing.proof_whatsapp" },
  { icon: Dumbbell, key: "landing.proof_classes" },
  { icon: CreditCard, key: "landing.proof_cards" },
];

const WHATSAPP_NUMBER = process.env.LANDING_WHATSAPP_NUMBER || "972500000000";
const PHONE_NUMBER = process.env.LANDING_PHONE_NUMBER || "";

export default function MarketingPage() {
  return (
    <main className="overflow-hidden bg-white">
      {/* ─── Navigation ─── */}
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <CalendarDays className="size-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">BookIT</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900">
              {T("landing.nav_features")}
            </a>
            <a href="#pricing" className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900">
              {T("landing.nav_pricing")}
            </a>
            <a href="#contact" className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900">
              {T("landing.contact_call")}
            </a>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              {T("landing.nav_login")}
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:shadow-blue-500/30 hover:brightness-105"
            >
              {T("landing.nav_cta")}
            </Link>
          </div>

          <MobileNav />
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden pb-20 pt-16 sm:pb-28 sm:pt-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/2 size-[500px] -translate-x-1/2 rounded-full bg-blue-100/60 blur-[100px]" />
          <div className="absolute -bottom-20 right-0 size-[350px] rounded-full bg-indigo-100/40 blur-[80px]" />
          <div className="absolute left-0 top-1/2 size-[250px] rounded-full bg-purple-100/30 blur-[60px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700">
              <Sparkles className="size-3.5" />
              {T("landing.hero_badge")}
            </div>

            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              {T("landing.hero_title")}
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-500 sm:text-lg">
              {T("landing.hero_subtitle")}
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:brightness-105 sm:w-auto"
              >
                {T("landing.hero_cta")}
                <ArrowIcon className="size-4" />
              </Link>
              <a
                href="#contact"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-8 py-4 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-400 hover:bg-slate-50 sm:w-auto"
              >
                {T("landing.hero_demo")}
              </a>
            </div>
          </div>

          <div className="mx-auto mt-16 max-w-5xl">
            <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-300/30">
              <DashboardMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Logo Marquee ─── */}
      <section className="border-y border-slate-100 bg-slate-50/50 py-8 sm:py-10">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
            {T("landing.logos_title")}
          </p>
          <div className="relative overflow-hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-slate-50/90 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-slate-50/90 to-transparent" />
            <div className="animate-marquee-rtl flex gap-10" style={{ width: "max-content" }}>
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="flex h-12 w-24 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm"
                >
                  <span className="text-[10px] font-bold text-slate-300">LOGO {(i % 6) + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Proof Pills ─── */}
      <section className="border-b border-slate-100 bg-white py-5">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <div className="flex items-center justify-between gap-4 overflow-x-auto scrollbar-hide sm:justify-center sm:gap-8 md:gap-12">
            {proofItems.map((item) => (
              <div key={item.key} className="flex shrink-0 items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-full bg-blue-50">
                  <item.icon className="size-3.5 text-blue-600" />
                </div>
                <span className="whitespace-nowrap text-sm font-medium text-slate-700">{T(item.key)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Feature Sections ─── */}
      <div id="features" className="scroll-mt-20">
        {featureBlocks.map((block, idx) => (
          <section key={block.titleKey} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
            <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 sm:py-28">
              <div className={`flex flex-col items-center gap-12 lg:flex-row lg:gap-20 ${idx % 2 !== 0 ? "lg:flex-row-reverse" : ""}`}>
                <div className="flex-1">
                  <div className={`mb-5 inline-flex rounded-xl bg-gradient-to-br ${block.gradient} p-3 shadow-lg`}>
                    <block.icon className="size-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                    {T(block.titleKey)}
                  </h2>
                  <p className="mt-4 text-base leading-relaxed text-slate-500 sm:text-lg">
                    {T(block.descKey)}
                  </p>
                  <ul className="mt-7 space-y-3.5">
                    {block.bullets.map((bk) => (
                      <li key={bk} className="flex items-start gap-3">
                        <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                          <Check className="size-3 text-emerald-600" />
                        </div>
                        <span className="text-sm text-slate-700">{T(bk)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-1">
                  <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/50">
                    {(() => {
                      const MockupComponent = mockupComponents[block.mockup];
                      return <MockupComponent />;
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* ─── Why Bookit (6 cards) ─── */}
      <section className="bg-gradient-to-b from-blue-50/80 to-indigo-50/50 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
              {T("landing.why_title")}
            </h2>
          </div>

          <div className="mx-auto mt-14 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {differentiators.map((d) => (
              <div
                key={d.titleKey}
                className="group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${d.gradient} p-2.5 shadow-md transition-transform duration-300 group-hover:scale-110`}>
                  <d.icon className="size-5 text-white" />
                </div>
                <h3 className="text-base font-bold text-slate-900">{T(d.titleKey)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{T(d.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-700">
              <Star className="size-3.5 fill-amber-500 text-amber-500" />
              {T("landing.testimonials_title")}
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              {T("landing.testimonials_title")}
            </h2>
          </div>

          <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2">
            {testimonials.map((item, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="absolute right-6 top-6 opacity-[0.07] transition-opacity group-hover:opacity-[0.12]">
                  <Quote className="size-12 text-blue-600" />
                </div>
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: item.stars }).map((_, s) => (
                    <Star key={s} className="size-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-slate-600">
                  &ldquo;{T(item.textKey)}&rdquo;
                </p>
                <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
                  <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-md">
                    {T(item.nameKey).charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{T(item.nameKey)}</p>
                    <p className="text-xs text-slate-400">BookIT user</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="bg-slate-50/60 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <h2 className="text-center text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {T("landing.how_title")}
          </h2>

          <div className="mx-auto mt-14 grid max-w-3xl gap-8 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step.num} className="text-center">
                <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-xl font-bold text-white shadow-lg shadow-blue-500/20">
                  {step.num}
                </div>
                <h3 className="text-base font-bold text-slate-900">{T(step.titleKey)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{T(step.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="scroll-mt-20 bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
              {T("landing.pricing_title")}
            </h2>
            <p className="mt-4 text-base text-slate-500 sm:text-lg">{T("landing.pricing_subtitle")}</p>
          </div>

          <div className="mx-auto mt-14 grid max-w-3xl gap-6 sm:grid-cols-2">
            {/* Starter */}
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{T("landing.plan_starter")}</h3>
                <p className="mt-1 text-sm text-slate-500">{T("landing.plan_starter_desc")}</p>
              </div>
              <div className="mt-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold tracking-tight text-slate-900">₪79</span>
                  <span className="text-sm text-slate-500">{T("landing.plan_per_month")}</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {T("landing.plan_yearly_note").replace("{amount}", "₪790")}
                </p>
              </div>
              <ul className="mt-8 flex-1 space-y-3">
                {starterFeatures.map((feat) => (
                  <li key={feat} className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                      <Check className="size-3 text-emerald-600" />
                    </div>
                    <span className="text-sm text-slate-700">{feat}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-8 block rounded-xl border-2 border-slate-300 bg-white py-3.5 text-center text-sm font-bold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
              >
                {T("landing.plan_cta")}
              </Link>
            </div>

            {/* Pro */}
            <div className="relative flex flex-col overflow-hidden rounded-2xl border-2 border-blue-500 bg-white p-8 shadow-lg shadow-blue-100">
              <div className="absolute -top-px left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-1 text-xs font-bold text-white shadow-md">
                {T("landing.plan_recommended")}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">{T("landing.plan_pro")}</h3>
                <p className="mt-1 text-sm text-slate-500">{T("landing.plan_pro_desc")}</p>
              </div>
              <div className="mt-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold tracking-tight text-slate-900">₪149</span>
                  <span className="text-sm text-slate-500">{T("landing.plan_per_month")}</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {T("landing.plan_yearly_note").replace("{amount}", "₪1,490")}
                </p>
              </div>
              <ul className="mt-8 flex-1 space-y-3">
                {proFeatures.map((feat) => (
                  <li key={feat} className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-100">
                      <Check className="size-3 text-blue-600" />
                    </div>
                    <span className="text-sm text-slate-700">{feat}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-8 block rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 py-3.5 text-center text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:brightness-105"
              >
                {T("landing.plan_cta")}
              </Link>
            </div>
          </div>

          {/* All plans include */}
          <div className="mx-auto mt-14 max-w-3xl">
            <p className="mb-5 text-center text-sm font-bold text-slate-900">
              {T("landing.plan_includes_title")}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
              {allPlansInclude.map((item) => (
                <div
                  key={item.key}
                  className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-4 text-center transition-shadow hover:shadow-sm"
                >
                  <item.icon className="size-4 text-blue-600" />
                  <span className="text-xs font-medium text-slate-600">{T(item.key)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Feature Comparison Table (collapsible) ─── */}
          <CompareTable />
        </div>
      </section>

      {/* ─── Contact Form + WhatsApp ─── */}
      <section id="contact" className="relative scroll-mt-20 overflow-hidden bg-gradient-to-b from-blue-50/80 to-indigo-50/60 py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -bottom-20 left-1/4 size-[300px] rounded-full bg-blue-100/50 blur-[80px]" />
          <div className="absolute -top-20 right-1/4 size-[250px] rounded-full bg-indigo-100/40 blur-[60px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 sm:px-6">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
              {T("landing.contact_title")}
            </h2>
            <p className="mt-4 text-base text-slate-500 sm:text-lg">
              {T("landing.contact_subtitle")}
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-md">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40">
              <ContactForm whatsappNumber={WHATSAPP_NUMBER} />
            </div>

            <div className="mt-10 flex flex-col items-center gap-4">
              <p className="text-sm text-slate-400">{T("landing.contact_or")}</p>
              <div className="flex gap-3">
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-green-500/20 transition-all hover:shadow-lg hover:shadow-green-500/30 hover:brightness-105"
                >
                  <MessageCircle className="size-4" />
                  {T("landing.contact_whatsapp")}
                </a>
                {PHONE_NUMBER && (
                  <a
                    href={`tel:${PHONE_NUMBER}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                  >
                    <Phone className="size-4" />
                    {T("landing.contact_call")}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-5 py-10 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <CalendarDays className="size-3.5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">BookIT</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm text-slate-500 transition-colors hover:text-slate-900">
              {T("landing.nav_features")}
            </a>
            <a href="#pricing" className="text-sm text-slate-500 transition-colors hover:text-slate-900">
              {T("landing.nav_pricing")}
            </a>
            <a href="#contact" className="text-sm text-slate-500 transition-colors hover:text-slate-900">
              {T("landing.contact_call")}
            </a>
            <Link href="/login" className="text-sm text-slate-500 transition-colors hover:text-slate-900">
              {T("landing.nav_login")}
            </Link>
          </div>

          <div className="flex flex-col items-center gap-2 text-sm text-slate-400 sm:flex-row sm:gap-4">
            <div className="flex items-center gap-4">
              <Link href="/terms" className="transition-colors hover:text-slate-600">
                {T("landing.footer_terms")}
              </Link>
              <span>&middot;</span>
              <Link href="/privacy" className="transition-colors hover:text-slate-600">
                {T("landing.footer_privacy")}
              </Link>
            </div>
            <span className="hidden sm:inline">&middot;</span>
            <div className="flex items-center gap-4">
              <span>{T("landing.built_in_israel")}</span>
              <span>&middot;</span>
              <span>&copy; {new Date().getFullYear()} BookIT. {T("landing.footer_rights")}</span>
            </div>
          </div>
        </div>
      </footer>

      <StickyMobileCta />
    </main>
  );
}
