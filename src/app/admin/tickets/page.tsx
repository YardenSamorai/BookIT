import { getAllTickets, getTicketStats } from "@/actions/tickets";
import { AdminTicketsClient } from "@/components/admin/admin-tickets-client";

export default async function AdminTicketsPage() {
  const [tickets, stats] = await Promise.all([
    getAllTickets(),
    getTicketStats(),
  ]);

  return <AdminTicketsClient tickets={tickets} stats={stats} />;
}
