import Link from "next/link";
import { CalendarDays, Clock, Users, Shield } from "lucide-react";
import { t } from "@/lib/i18n";

const locale = "he";

const features = [
  { icon: CalendarDays, label: "ניהול תורים חכם" },
  { icon: Users, label: "ניהול לקוחות וצוות" },
  { icon: Clock, label: "זמינות בזמן אמת" },
  { icon: Shield, label: "אבטחה מלאה" },
];

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
      {/* Left Panel - Desktop only */}
      <div className="relative hidden w-1/2 overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
        <div className="absolute -bottom-24 -left-24 size-96 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute -top-24 -right-24 size-80 rounded-full bg-indigo-400/20 blur-3xl" />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <CalendarDays className="size-5 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">
              BookIT
            </span>
          </Link>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-3xl font-bold leading-tight text-white">
              הפלטפורמה המובילה
              <br />
              <span className="text-indigo-200">לניהול תורים</span>
            </h2>
            <p className="mt-4 max-w-sm text-base leading-relaxed text-indigo-100/80">
              {t(locale, "auth.signup_subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {features.map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm"
              >
                <f.icon className="size-4 shrink-0 text-indigo-200" />
                <span className="text-sm font-medium text-white/90">
                  {f.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-xs text-indigo-200/50">
            © {new Date().getFullYear()} BookIT. כל הזכויות שמורות.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="relative flex w-full flex-col lg:w-1/2">
        {/* Form area */}
        <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-8 lg:px-16">
          <div className="mx-auto w-full max-w-[400px]">
            {/* Mobile logo */}
            <Link
              href="/"
              className="mb-10 inline-flex items-center gap-2.5 lg:hidden"
            >
              <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-600">
                <CalendarDays className="size-4 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-900">
                BookIT
              </span>
            </Link>

            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                {title}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
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
