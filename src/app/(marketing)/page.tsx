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
  Clock,
  UserCheck,
  Layers,
} from "lucide-react";
import { t, isRtl, type Locale } from "@/lib/i18n";
import { MobileNav } from "./components/mobile-nav";
import { StickyMobileCta } from "./components/sticky-mobile-cta";
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

const proofItems = [
  { icon: Globe, key: "landing.proof_site" },
  { icon: Users, key: "landing.proof_crm" },
  { icon: MessageCircle, key: "landing.proof_whatsapp" },
  { icon: Dumbbell, key: "landing.proof_classes" },
  { icon: CreditCard, key: "landing.proof_cards" },
];

const featureBlocks = [
  {
    titleKey: "landing.feat_site_title",
    descKey: "landing.feat_site_desc",
    bullets: [
      "landing.feat_site_1",
      "landing.feat_site_2",
      "landing.feat_site_3",
      "landing.feat_site_4",
    ],
    icon: Paintbrush,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    mockup: "site" as const,
  },
  {
    titleKey: "landing.feat_crm_title",
    descKey: "landing.feat_crm_desc",
    bullets: [
      "landing.feat_crm_1",
      "landing.feat_crm_2",
      "landing.feat_crm_3",
      "landing.feat_crm_4",
    ],
    icon: UserCheck,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    mockup: "crm" as const,
  },
  {
    titleKey: "landing.feat_wa_title",
    descKey: "landing.feat_wa_desc",
    bullets: [
      "landing.feat_wa_1",
      "landing.feat_wa_2",
      "landing.feat_wa_3",
      "landing.feat_wa_4",
    ],
    icon: MessageCircle,
    color: "text-green-600",
    bgColor: "bg-green-50",
    mockup: "whatsapp" as const,
  },
  {
    titleKey: "landing.feat_ops_title",
    descKey: "landing.feat_ops_desc",
    bullets: [
      "landing.feat_ops_1",
      "landing.feat_ops_2",
      "landing.feat_ops_3",
      "landing.feat_ops_4",
    ],
    icon: CalendarDays,
    color: "text-slate-700",
    bgColor: "bg-slate-100",
    mockup: "ops" as const,
  },
];

const mockupComponents = {
  site: SiteMockup,
  crm: CrmMockup,
  whatsapp: WhatsAppMockup,
  ops: OpsMockup,
};

const steps = [
  {
    num: "1",
    titleKey: "landing.how_step1_title",
    descKey: "landing.how_step1_desc",
  },
  {
    num: "2",
    titleKey: "landing.how_step2_title",
    descKey: "landing.how_step2_desc",
  },
  {
    num: "3",
    titleKey: "landing.how_step3_title",
    descKey: "landing.how_step3_desc",
  },
];

const differentiators = [
  {
    titleKey: "landing.why1_title",
    descKey: "landing.why1_desc",
    icon: Layers,
  },
  {
    titleKey: "landing.why2_title",
    descKey: "landing.why2_desc",
    icon: Phone,
  },
  {
    titleKey: "landing.why3_title",
    descKey: "landing.why3_desc",
    icon: CalendarDays,
  },
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
];

const allPlansInclude = [
  { key: "landing.plan_includes_site", icon: Globe },
  { key: "landing.plan_includes_crm", icon: Users },
  { key: "landing.plan_includes_wa", icon: MessageCircle },
  { key: "landing.plan_includes_classes", icon: Dumbbell },
  { key: "landing.plan_includes_analytics", icon: BarChart3 },
  { key: "landing.plan_includes_cards", icon: CreditCard },
];

export default function MarketingPage() {
  return (
    <main className="overflow-hidden">
      {/* ─── Navigation ─── */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-slate-900">
              <CalendarDays className="size-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              BookIT
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
            >
              {T("landing.nav_features")}
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
            >
              {T("landing.nav_pricing")}
            </a>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              {T("landing.nav_login")}
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              {T("landing.nav_cta")}
            </Link>
          </div>

          <MobileNav />
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="bg-white pb-16 pt-16 sm:pb-24 sm:pt-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-sm font-medium text-slate-600">
              <Clock className="size-3.5" />
              {T("landing.hero_badge")}
            </div>

            <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              {T("landing.hero_title")}
            </h1>

            <p className="mt-5 text-base leading-relaxed text-slate-500 sm:text-lg">
              {T("landing.hero_subtitle")}
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 sm:w-auto"
              >
                {T("landing.hero_cta")}
                <ArrowIcon className="size-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-7 py-3.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 sm:w-auto"
              >
                {T("landing.hero_demo")}
              </a>
            </div>
          </div>

          {/* Product dashboard preview */}
          <div className="mx-auto mt-14 max-w-5xl">
            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* ─── Proof Bar ─── */}
      <section className="border-y border-slate-200 bg-slate-50 py-6">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <div className="flex items-center justify-between gap-6 overflow-x-auto scrollbar-hide sm:justify-center sm:gap-10 md:gap-14">
            {proofItems.map((item) => (
              <div
                key={item.key}
                className="flex shrink-0 items-center gap-2 text-slate-600"
              >
                <item.icon className="size-4 text-slate-400" />
                <span className="whitespace-nowrap text-sm font-medium">
                  {T(item.key)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Feature Sections ─── */}
      <div id="features" className="scroll-mt-20">
        {featureBlocks.map((block, idx) => (
          <section
            key={block.titleKey}
            className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}
          >
            <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-24">
              <div
                className={`flex flex-col items-center gap-10 lg:flex-row lg:gap-16 ${
                  idx % 2 !== 0 ? "lg:flex-row-reverse" : ""
                }`}
              >
                {/* Text */}
                <div className="flex-1">
                  <div
                    className={`mb-4 inline-flex rounded-xl p-3 ${block.bgColor}`}
                  >
                    <block.icon className={`size-5 ${block.color}`} />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    {T(block.titleKey)}
                  </h2>
                  <p className="mt-3 text-base leading-relaxed text-slate-500">
                    {T(block.descKey)}
                  </p>
                  <ul className="mt-6 space-y-3">
                    {block.bullets.map((bk) => (
                      <li key={bk} className="flex items-start gap-3">
                        <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                        <span className="text-sm text-slate-700">{T(bk)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Feature mockup */}
                <div className="flex-1">
                  {(() => {
                    const MockupComponent = mockupComponents[block.mockup];
                    return <MockupComponent />;
                  })()}
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* ─── How It Works ─── */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {T("landing.how_title")}
          </h2>

          <div className="mx-auto mt-14 grid max-w-3xl gap-8 sm:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.num} className="text-center">
                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full border-2 border-slate-900 text-lg font-bold text-slate-900">
                  {step.num}
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  {T(step.titleKey)}
                </h3>
                <p className="mt-1.5 text-sm text-slate-500">
                  {T(step.descKey)}
                </p>
                {i < steps.length - 1 && (
                  <div className="mx-auto mt-6 hidden h-px w-16 bg-slate-200 sm:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Why Bookit ─── */}
      <section className="bg-slate-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {T("landing.why_title")}
          </h2>

          <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-3">
            {differentiators.map((d) => (
              <div
                key={d.titleKey}
                className="rounded-xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-sm"
              >
                <div className="mb-4 inline-flex rounded-lg bg-slate-100 p-2.5">
                  <d.icon className="size-5 text-slate-700" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  {T(d.titleKey)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {T(d.descKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="scroll-mt-20 bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {T("landing.pricing_title")}
            </h2>
            <p className="mt-3 text-base text-slate-500">
              {T("landing.pricing_subtitle")}
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-2">
            {/* Starter */}
            <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-7">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {T("landing.plan_starter")}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {T("landing.plan_starter_desc")}
                </p>
              </div>

              <div className="mt-5">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight text-slate-900">₪79</span>
                  <span className="text-sm text-slate-500">{T("landing.plan_per_month")}</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {T("landing.plan_yearly_note").replace("{amount}", "₪790")}
                </p>
              </div>

              <ul className="mt-7 flex-1 space-y-3">
                {starterFeatures.map((feat) => (
                  <li key={feat} className="flex items-start gap-3">
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    <span className="text-sm text-slate-700">{feat}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className="mt-7 block rounded-xl border border-slate-300 bg-white py-3 text-center text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                {T("landing.plan_cta")}
              </Link>
            </div>

            {/* Pro */}
            <div className="relative flex flex-col rounded-xl border-2 border-blue-600 bg-white p-7">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1 text-xs font-semibold text-white">
                {T("landing.plan_recommended")}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {T("landing.plan_pro")}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {T("landing.plan_pro_desc")}
                </p>
              </div>

              <div className="mt-5">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight text-slate-900">₪149</span>
                  <span className="text-sm text-slate-500">{T("landing.plan_per_month")}</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {T("landing.plan_yearly_note").replace("{amount}", "₪1,490")}
                </p>
              </div>

              <ul className="mt-7 flex-1 space-y-3">
                {proFeatures.map((feat) => (
                  <li key={feat} className="flex items-start gap-3">
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    <span className="text-sm text-slate-700">{feat}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className="mt-7 block rounded-xl bg-blue-600 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                {T("landing.plan_cta")}
              </Link>
            </div>
          </div>

          {/* All plans include */}
          <div className="mx-auto mt-12 max-w-3xl">
            <p className="mb-5 text-center text-sm font-semibold text-slate-900">
              {T("landing.plan_includes_title")}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
              {allPlansInclude.map((item) => (
                <div
                  key={item.key}
                  className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-4 text-center"
                >
                  <item.icon className="size-4 text-slate-500" />
                  <span className="text-xs font-medium text-slate-600">
                    {T(item.key)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="bg-slate-900 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {T("landing.cta_title")}
            </h2>
            <p className="mt-4 text-base text-slate-400">
              {T("landing.cta_subtitle")}
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100"
            >
              {T("landing.cta_button")}
              <ArrowIcon className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-5 py-8 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-slate-900">
              <CalendarDays className="size-3.5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              BookIT
            </span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="#features"
              className="text-sm text-slate-500 transition-colors hover:text-slate-900"
            >
              {T("landing.nav_features")}
            </a>
            <a
              href="#pricing"
              className="text-sm text-slate-500 transition-colors hover:text-slate-900"
            >
              {T("landing.nav_pricing")}
            </a>
            <Link
              href="/login"
              className="text-sm text-slate-500 transition-colors hover:text-slate-900"
            >
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
              <span>
                &copy; {new Date().getFullYear()} BookIT.{" "}
                {T("landing.footer_rights")}
              </span>
            </div>
          </div>
        </div>
      </footer>

      <StickyMobileCta />
    </main>
  );
}
