import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getPublicBusinessData } from "@/lib/db/queries/public-site";
import { getCustomerAppointments } from "@/lib/db/queries/appointments";
import {
  getCustomerByUserId,
  getCustomerPackages,
  type CustomerPackageRow,
} from "@/lib/db/queries/customers";
import { getCustomerCards, type CustomerCardRow } from "@/lib/db/queries/cards";
import { CustomerPortal } from "@/components/booking/customer-portal";
import { t, getDir, type Locale } from "@/lib/i18n";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { ArrowRight } from "lucide-react";

const APP_DOMAIN = (process.env.NEXT_PUBLIC_APP_DOMAIN || "localhost:3000").replace(/^www\./, "").split(":")[0];

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function MyAppointmentsPage({ params }: Props) {
  const { slug } = await params;
  const [session, data, headersList] = await Promise.all([
    auth(),
    getPublicBusinessData(slug),
    headers(),
  ]);

  if (!data) notFound();

  const host = (headersList.get("host") || "").split(":")[0];
  const isSubdomain = host !== APP_DOMAIN && host !== `www.${APP_DOMAIN}` && host.endsWith(APP_DOMAIN);
  const basePath = isSubdomain ? "" : `/b/${slug}`;

  const isAuthenticated = !!session?.user?.id;
  let businessAppointments: Awaited<ReturnType<typeof getCustomerAppointments>> = [];
  let customerPkgs: CustomerPackageRow[] = [];
  let customerCardsList: CustomerCardRow[] = [];
  let userProfile: {
    id: string;
    name: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
  } | null = null;

  if (isAuthenticated) {
    const userId = session!.user!.id!;
    const [appointments, customer, user] = await Promise.all([
      getCustomerAppointments(userId),
      getCustomerByUserId(userId, data.business.id),
      db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      }),
    ]);

    businessAppointments = appointments.filter((a) => a.businessSlug === slug);

    if (user) {
      userProfile = {
        id: user.id,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
      };
    }

    if (customer) {
      [customerPkgs, customerCardsList] = await Promise.all([
        getCustomerPackages(customer.id, data.business.id),
        getCustomerCards(customer.id, data.business.id),
      ]);
    }
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
            href={basePath || "/"}
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
          <LocaleProvider locale={locale}>
            <CustomerPortal
              isAuthenticated={isAuthenticated}
              user={userProfile}
              appointments={businessAppointments}
              packages={customerPkgs}
              cards={customerCardsList}
              slug={slug}
              basePath={basePath}
              businessName={data.business.name}
              secondaryColor={data.business.secondaryColor}
              primaryColor={data.business.primaryColor}
            />
          </LocaleProvider>
        </div>
      </main>
    </div>
  );
}
