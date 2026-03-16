import Link from "next/link";
import {
  CalendarDays,
  Paintbrush,
  Users,
  CreditCard,
  Bell,
  BarChart3,
  ArrowRight,
  Check,
  Sparkles,
} from "lucide-react";
import { MobileNav } from "./components/mobile-nav";

const features = [
  {
    icon: CalendarDays,
    title: "Smart Scheduling",
    description:
      "Automated availability, conflict prevention, and real-time slot management.",
  },
  {
    icon: Paintbrush,
    title: "Beautiful Booking Sites",
    description:
      "Premium, branded booking pages that convert visitors into customers.",
  },
  {
    icon: Users,
    title: "Staff Management",
    description: "Schedules, time off, and per-staff availability.",
  },
  {
    icon: CreditCard,
    title: "Flexible Payments",
    description:
      "Support for deposits, packages, on-site payments, and more.",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description:
      "SMS, email, and WhatsApp reminders to reduce no-shows.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track bookings, revenue, and staff performance.",
  },
];

const steps = [
  {
    number: "1",
    title: "Sign Up",
    description: "Create your account in seconds.",
  },
  {
    number: "2",
    title: "Set Up",
    description: "Add your services, staff, and hours.",
  },
  {
    number: "3",
    title: "Go Live",
    description: "Publish your booking site and start accepting appointments.",
  },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started",
    features: ["1 staff member", "5 services", "50 bookings / month", "Basic booking page", "Email notifications"],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Starter",
    price: "$19",
    period: "/ month",
    description: "For growing businesses",
    features: [
      "5 staff members",
      "20 services",
      "500 bookings / month",
      "Custom branding",
      "SMS & email reminders",
      "Analytics dashboard",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/ month",
    description: "For established businesses",
    features: [
      "Unlimited staff",
      "Unlimited services",
      "Unlimited bookings",
      "Priority support",
      "Advanced analytics",
      "API access",
      "WhatsApp notifications",
    ],
    cta: "Contact Us",
    highlighted: false,
  },
];

export default function MarketingPage() {
  return (
    <main dir="ltr" className="overflow-hidden">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-600">
              <CalendarDays className="size-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">
              BookIT
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              Pricing
            </a>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
            >
              Get Started
            </Link>
          </div>

          <MobileNav />
        </div>
      </nav>

      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-50/80 via-white to-white" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/40 via-transparent to-transparent" />

        <div className="mx-auto max-w-7xl px-6 pb-24 pt-20 sm:pb-32 sm:pt-28 lg:pt-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700">
              <Sparkles className="size-3.5" />
              Now in public beta
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              The Booking Platform{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Your Business Deserves
              </span>
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-gray-600 sm:text-xl">
              Create a stunning booking website in minutes. Manage appointments,
              staff, and customers — all in one place.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-600/30"
              >
                Get Started Free
                <ArrowRight className="size-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-8 py-3.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50"
              >
                See Demo
              </a>
            </div>

            <p className="mt-6 text-xs text-gray-500">
              Free forever for small teams. No credit card required.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 bg-gray-50/50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
              Features
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to run your booking business
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Powerful tools, beautifully simple. Built for businesses that value
              their time.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md"
              >
                <div className="mb-4 inline-flex rounded-xl bg-indigo-50 p-3 text-indigo-600 transition-colors group-hover:bg-indigo-100">
                  <feature.icon className="size-5" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Get started in 3 simple steps
            </h2>
          </div>

          <div className="mx-auto mt-16 grid max-w-4xl gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.title} className="relative text-center">
                {i < steps.length - 1 && (
                  <div className="absolute left-1/2 top-8 hidden h-px w-full bg-gradient-to-r from-indigo-300 to-transparent md:block" />
                )}
                <div className="relative mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-indigo-600 text-2xl font-bold text-white shadow-lg shadow-indigo-600/25">
                  {step.number}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-20 bg-gray-50/50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
              Pricing
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Start free and scale as you grow. No hidden fees.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border p-8 shadow-sm transition-shadow hover:shadow-md ${
                  plan.highlighted
                    ? "border-indigo-600 bg-white ring-1 ring-indigo-600"
                    : "border-gray-200 bg-white"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-xs font-semibold text-white">
                    Recommended
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {plan.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {plan.description}
                  </p>
                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-sm text-gray-500">{plan.period}</span>
                  </div>
                </div>

                <ul className="mt-8 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="mt-0.5 size-4 shrink-0 text-indigo-600" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className={`mt-8 block rounded-xl py-3 text-center text-sm font-semibold transition-colors ${
                    plan.highlighted
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700"
                      : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 px-8 py-20 text-center shadow-2xl sm:px-16">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />

            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ready to grow your business?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-indigo-100">
                Join thousands of businesses using BookIT to streamline their
                scheduling and delight their customers.
              </p>
              <Link
                href="/signup"
                className="mt-10 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-indigo-700 shadow-lg transition-all hover:bg-indigo-50"
              >
                Get Started Free
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-10 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-600">
              <CalendarDays className="size-3.5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900">
              BookIT
            </span>
          </div>

          <div className="flex items-center gap-8">
            <a
              href="#features"
              className="text-sm text-gray-600 transition-colors hover:text-gray-900"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-sm text-gray-600 transition-colors hover:text-gray-900"
            >
              Pricing
            </a>
            <Link
              href="/login"
              className="text-sm text-gray-600 transition-colors hover:text-gray-900"
            >
              Login
            </Link>
          </div>

          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} BookIT. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
