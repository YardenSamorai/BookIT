import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicBusinessData } from "@/lib/db/queries/public-site";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { getDir, type Locale } from "@/lib/i18n";
import { ArrowRight } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ service?: string }>;
}

export default async function BookingPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { service: preSelectedServiceId } = await searchParams;
  const data = await getPublicBusinessData(slug);

  if (!data) notFound();

  const activeServices = data.services.filter((s) => s.isActive);
  const activeStaff = data.staff.filter((s) => s.isActive);
  const locale = (data.business.language as Locale) || "he";
  const dir = getDir(locale);

  const validPreSelected = preSelectedServiceId && activeServices.some((s) => s.id === preSelectedServiceId)
    ? preSelectedServiceId
    : undefined;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-white" dir={dir}>
      <header
        className="sticky top-0 z-20 px-4 py-3"
        style={{ backgroundColor: data.business.primaryColor }}
      >
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <Link
            href={`/b/${slug}`}
            className="flex size-8 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
          >
            <ArrowRight className={`size-4 ${dir === "ltr" ? "rotate-180" : ""}`} />
          </Link>
          <span className="text-sm font-semibold text-white">
            {data.business.name}
          </span>
          <div className="w-8" />
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 py-6">
          <BookingWizard
            businessId={data.business.id}
            businessName={data.business.name}
            services={activeServices}
            staff={activeStaff}
            staffServiceMap={data.staffServiceMap}
            serviceStaffMap={data.serviceStaffMap}
            primaryColor={data.business.primaryColor}
            secondaryColor={data.business.secondaryColor}
            currency={data.business.currency}
            locale={locale}
            initialServiceId={validPreSelected}
          />
        </div>
      </main>
    </div>
  );
}
