"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CheckCircle,
  Loader2 as Spinner,
  XCircle,
  LifeBuoy,
  MessageSquare,
} from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";

type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: string;
  adminNotes: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
}

const STATUS_CONFIG: Record<
  TicketStatus,
  { color: string; icon: typeof Clock; key: string }
> = {
  OPEN: {
    color: "bg-amber-50 text-amber-700",
    icon: Clock,
    key: "tickets.status_open",
  },
  IN_PROGRESS: {
    color: "bg-blue-50 text-blue-700",
    icon: Spinner,
    key: "tickets.status_in_progress",
  },
  RESOLVED: {
    color: "bg-emerald-50 text-emerald-700",
    icon: CheckCircle,
    key: "tickets.status_resolved",
  },
  CLOSED: {
    color: "bg-slate-100 text-slate-500",
    icon: XCircle,
    key: "tickets.status_closed",
  },
};

export function TicketsListClient({ tickets }: { tickets: Ticket[] }) {
  const t = useT();

  if (tickets.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <LifeBuoy className="size-10 text-slate-300" />
          <p className="text-sm text-muted-foreground">
            {t("tickets.empty" as never)}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {tickets.map((ticket) => {
        const cfg = STATUS_CONFIG[ticket.status];
        const Icon = cfg.icon;
        return (
          <Card key={ticket.id} className="transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-slate-900">
                      {ticket.subject}
                    </h3>
                    <Badge
                      variant="secondary"
                      className={`shrink-0 text-[10px] ${cfg.color}`}
                    >
                      <Icon className="mr-1 size-3" />
                      {t(cfg.key as never)}
                    </Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                    {ticket.description}
                  </p>

                  {ticket.adminNotes && (
                    <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
                      <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-blue-700">
                        <MessageSquare className="size-3" />
                        {t("tickets.admin_response" as never)}
                      </div>
                      <p className="text-xs text-blue-900 whitespace-pre-line">
                        {ticket.adminNotes}
                      </p>
                    </div>
                  )}
                </div>

                <span className="shrink-0 text-[10px] text-muted-foreground" dir="ltr">
                  {new Date(ticket.createdAt).toLocaleDateString("he-IL")}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
