import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { businesses } from "@/lib/db/schema";
import { getBusinessByOwnerId } from "@/lib/db/queries/business";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { SuspendedScreen } from "@/components/dashboard/suspended-screen";
import { ReportBugButton } from "@/components/dashboard/report-bug-button";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { getDir, type Locale } from "@/lib/i18n";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "SUPER_ADMIN") {
    redirect("/admin");
  }

  const business = session.user.businessId
    ? await db.query.businesses.findFirst({
        where: eq(businesses.id, session.user.businessId),
        columns: { name: true, slug: true, language: true, subscriptionStatus: true },
      })
    : await getBusinessByOwnerId(session.user.id);

  if (!business) {
    redirect("/onboarding");
  }

  const locale = ((business as { language?: string }).language ?? "he") as Locale;

  if ((business as { subscriptionStatus?: string }).subscriptionStatus === "CANCELLED") {
    return <SuspendedScreen locale={locale} />;
  }

  return (
    <LocaleProvider locale={locale}>
      <div dir={getDir(locale)}>
        <SidebarProvider>
          <AppSidebar businessSlug={business?.slug} />
          <SidebarInset>
            <Topbar
              userName={session.user.name || "User"}
              businessName={business?.name}
              businessSlug={business?.slug}
            />
            <main className="flex-1 p-6">{children}</main>
          </SidebarInset>
          <ReportBugButton />
        </SidebarProvider>
      </div>
    </LocaleProvider>
  );
}
