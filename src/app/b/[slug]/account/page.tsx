import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { getPublicBusinessData } from "@/lib/db/queries/public-site";
import { getCustomerAppointments } from "@/lib/db/queries/appointments";
import { AccountPageClient } from "@/components/booking/account-page-client";
import { t, getDir, type Locale } from "@/lib/i18n";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AccountPage({ params }: Props) {
  const { slug } = await params;
  const [session, data] = await Promise.all([
    auth(),
    getPublicBusinessData(slug),
  ]);

  if (!data) notFound();
  if (!session?.user?.id) redirect(`/login?callbackUrl=/b/${slug}/account`);

  const appointments = await getCustomerAppointments(session.user.id);
  const businessAppointments = appointments.filter(
    (a) => a.businessSlug === slug
  );
  const locale = (data.business.language as Locale) || "he";
  const dir = getDir(locale);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50" dir={dir}>
      <header
        className="border-b px-4 py-3 sm:px-6"
        style={{ backgroundColor: data.business.primaryColor }}
      >
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <span className="text-base font-bold text-white sm:text-lg">
            {data.business.name}
          </span>
          <span className="text-xs text-white/60">{t(locale, "myapt.account")}</span>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                {t(locale, "myapt.account")}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {t(locale, "myapt.subtitle")}
              </p>
            </div>
            <Link
              href={`/b/${slug}`}
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100"
            >
              <ArrowLeft className="size-3.5" />
              {t(locale, "myapt.back_to_site")}
            </Link>
          </div>

          {/* Customer info card */}
          <div className="mb-6 rounded-xl border bg-white p-4 sm:p-5">
            <div className="flex items-center gap-4">
              <div
                className="flex size-12 items-center justify-center rounded-full text-lg font-bold text-white"
                style={{ backgroundColor: data.business.primaryColor }}
              >
                {session.user.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-gray-900">{session.user.name}</p>
                {session.user.phone && (
                  <p className="text-sm text-gray-500" dir="ltr">{session.user.phone}</p>
                )}
                {session.user.email && (
                  <p className="truncate text-sm text-gray-500">{session.user.email}</p>
                )}
              </div>
            </div>
          </div>

          <LocaleProvider locale={locale}>
            <AccountPageClient
              appointments={businessAppointments}
              businessId={data.business.id}
              secondaryColor={data.business.secondaryColor}
            />
          </LocaleProvider>
        </div>
      </main>
    </div>
  );
}
