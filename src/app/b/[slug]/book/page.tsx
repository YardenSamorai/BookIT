import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getPublicBusinessData } from "@/lib/db/queries/public-site";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { getDir, type Locale } from "@/lib/i18n";
import { ArrowRight } from "lucide-react";

const APP_DOMAIN = (process.env.NEXT_PUBLIC_APP_DOMAIN || "localhost:3000").replace(/^www\./, "").split(":")[0];

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ service?: string }>;
}

export default async function BookingPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { service: preSelectedServiceId } = await searchParams;
  const data = await getPublicBusinessData(slug);

  if (!data) notFound();

  const headersList = await headers();
  const host = (headersList.get("host") || "").split(":")[0];
  const isSubdomain = host !== APP_DOMAIN && host !== `www.${APP_DOMAIN}` && host.endsWith(APP_DOMAIN);
  const basePath = isSubdomain ? "" : `/b/${slug}`;

  if (data.business.subscriptionStatus === "CANCELLED") {
    redirect(basePath || "/");
  }

  const activeServices = data.services.filter((s) => s.isActive);
  const activeStaff = data.staff.filter((s) => s.isActive);
  const hasRegularServices = activeServices.some((s) => !s.isGroup);
  const locale = (data.business.language as Locale) || "he";
  const dir = getDir(locale);
  const { primaryColor, secondaryColor, name, logoUrl } = data.business;

  const validPreSelected = preSelectedServiceId && activeServices.some((s) => s.id === preSelectedServiceId)
    ? preSelectedServiceId
    : undefined;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-gray-50/50" dir={dir}>
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex items-center gap-3 px-4 py-3 md:px-8">
          <Link
            href={basePath || "/"}
            className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-gray-100 text-gray-400 transition-all hover:bg-gray-50 hover:text-gray-600 active:scale-95"
          >
            <ArrowRight className={`size-4 ${dir === "ltr" ? "rotate-180" : ""}`} />
          </Link>

          <div className="flex flex-1 items-center justify-center gap-2.5">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={name}
                className="size-7 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <div
                className="flex size-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white"
                style={{ backgroundColor: secondaryColor }}
              >
                {name.charAt(0)}
              </div>
            )}
            <span className="text-sm font-semibold text-gray-900">
              {name}
            </span>
          </div>

          <div className="w-9 shrink-0" />
        </div>
        {/* Thin brand accent line */}
        <div
          className="h-[2px]"
          style={{
            background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
          }}
        />
      </header>

      {/* Content */}
      <main className="flex flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 py-6 md:max-w-none md:px-8">
          <BookingWizard
            businessId={data.business.id}
            businessName={name}
            services={activeServices}
            staff={activeStaff}
            staffServiceMap={data.staffServiceMap}
            serviceStaffMap={data.serviceStaffMap}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            currency={data.business.currency}
            locale={locale}
            initialServiceId={validPreSelected}
            hasWorkouts={data.hasWorkouts}
            hasRegularServices={hasRegularServices}
          />
        </div>
      </main>
    </div>
  );
}
