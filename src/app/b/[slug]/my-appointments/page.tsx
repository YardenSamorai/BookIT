import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { getPublicBusinessData } from "@/lib/db/queries/public-site";
import { getCustomerAppointments } from "@/lib/db/queries/appointments";
import { MyAppointmentsGate } from "@/components/booking/my-appointments-gate";
import { t, getDir, type Locale } from "@/lib/i18n";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { ArrowRight } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function MyAppointmentsPage({ params }: Props) {
  const { slug } = await params;
  const [session, data] = await Promise.all([
    auth(),
    getPublicBusinessData(slug),
  ]);

  if (!data) notFound();

  const isAuthenticated = !!session?.user?.id;
  let businessAppointments: Awaited<ReturnType<typeof getCustomerAppointments>> = [];

  if (isAuthenticated) {
    const appointments = await getCustomerAppointments(session!.user!.id!);
    businessAppointments = appointments.filter(
      (a) => a.businessSlug === slug
    );
  }

  const locale = (data.business.language as Locale) || "he";
  const dir = getDir(locale);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50" dir={dir}>
      <header
        className="border-b px-4 py-3 sm:px-6"
        style={{ backgroundColor: data.business.primaryColor }}
      >
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link
            href={`/b/${slug}`}
            className="flex size-8 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
          >
            <ArrowRight className={`size-4 ${dir === "ltr" ? "rotate-180" : ""}`} />
          </Link>
          <span className="text-base font-bold text-white sm:text-lg">
            {data.business.name}
          </span>
          <div className="w-8" />
        </div>
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            {t(locale, "myapt.title")}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t(locale, "myapt.subtitle")}
          </p>

          <div className="mt-6">
            <LocaleProvider locale={locale}>
              <MyAppointmentsGate
                isAuthenticated={isAuthenticated}
                appointments={businessAppointments}
                secondaryColor={data.business.secondaryColor}
              />
            </LocaleProvider>
          </div>
        </div>
      </main>
    </div>
  );
}
