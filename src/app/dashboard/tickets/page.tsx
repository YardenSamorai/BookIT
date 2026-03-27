import { getMyTickets } from "@/actions/tickets";
import { requireBusinessOwner } from "@/lib/auth/guards";
import { t, type Locale } from "@/lib/i18n";
import { db } from "@/lib/db";
import { businesses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/shared/page-header";
import { TicketsListClient } from "@/components/tickets/tickets-list-client";

export default async function TicketsPage() {
  const { businessId } = await requireBusinessOwner();

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
    columns: { language: true },
  });

  const locale = (business?.language ?? "he") as Locale;
  const tickets = await getMyTickets();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(locale, "tickets.title" as never)}
        description={t(locale, "tickets.subtitle" as never)}
      />
      <TicketsListClient tickets={tickets} />
    </div>
  );
}
