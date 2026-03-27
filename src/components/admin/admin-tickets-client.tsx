"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Clock,
  CheckCircle,
  Loader2,
  XCircle,
  ChevronDown,
  ChevronUp,
  TicketCheck,
  Building2,
  User,
  Send,
  AlertTriangle,
} from "lucide-react";
import { updateTicketStatus } from "@/actions/tickets";

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
  updatedAt: Date;
  businessName: string | null;
  userName: string | null;
  userEmail: string | null;
}

interface Stats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
}

const STATUS_STYLES: Record<TicketStatus, string> = {
  OPEN: "bg-amber-50 text-amber-700",
  IN_PROGRESS: "bg-blue-50 text-blue-700",
  RESOLVED: "bg-emerald-50 text-emerald-700",
  CLOSED: "bg-slate-100 text-slate-500",
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: "פתוח",
  IN_PROGRESS: "בטיפול",
  RESOLVED: "נפתר",
  CLOSED: "סגור",
};

const PRIORITY_STYLES: Record<string, string> = {
  HIGH: "bg-red-50 text-red-700",
  MEDIUM: "bg-amber-50 text-amber-700",
  LOW: "bg-slate-100 text-slate-500",
};

const PRIORITY_LABELS: Record<string, string> = {
  HIGH: "גבוהה",
  MEDIUM: "בינונית",
  LOW: "נמוכה",
};

const TABS: { key: string; label: string }[] = [
  { key: "ALL", label: "הכל" },
  { key: "OPEN", label: "פתוחים" },
  { key: "IN_PROGRESS", label: "בטיפול" },
  { key: "RESOLVED", label: "נפתרו" },
  { key: "CLOSED", label: "סגורים" },
];

export function AdminTicketsClient({
  tickets,
  stats,
}: {
  tickets: Ticket[];
  stats: Stats;
}) {
  const [filter, setFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered =
    filter === "ALL"
      ? tickets
      : tickets.filter((t) => t.status === filter);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">טיקטים</h1>
          <p className="text-sm text-muted-foreground">
            ניהול דיווחי באגים ובקשות תמיכה מבעלי עסקים
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="פתוחים" count={stats.open} color="text-amber-600" />
        <StatCard label="בטיפול" count={stats.inProgress} color="text-blue-600" />
        <StatCard label="נפתרו" count={stats.resolved} color="text-emerald-600" />
        <StatCard label="סה״כ" count={stats.total} color="text-slate-600" />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-lg border bg-slate-50 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === tab.key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
            {tab.key === "OPEN" && stats.open > 0 && (
              <span className="mr-1 inline-flex size-4 items-center justify-center rounded-full bg-amber-100 text-[10px] text-amber-700">
                {stats.open}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Ticket list */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <TicketCheck className="size-10 text-slate-300" />
            <p className="text-sm text-muted-foreground">אין טיקטים בקטגוריה זו</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((ticket) => (
            <TicketRow
              key={ticket.id}
              ticket={ticket}
              isExpanded={expandedId === ticket.id}
              onToggle={() =>
                setExpandedId(expandedId === ticket.id ? null : ticket.id)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <p className={`text-2xl font-bold ${color}`}>{count}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function TicketRow({
  ticket,
  isExpanded,
  onToggle,
}: {
  ticket: Ticket;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState(ticket.adminNotes ?? "");

  function handleStatusChange(newStatus: TicketStatus) {
    startTransition(async () => {
      await updateTicketStatus(ticket.id, newStatus, notes || undefined);
      router.refresh();
    });
  }

  function handleSaveNotes() {
    startTransition(async () => {
      await updateTicketStatus(ticket.id, ticket.status, notes);
      router.refresh();
    });
  }

  return (
    <Card className="overflow-hidden">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-start transition-colors hover:bg-slate-50"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold text-slate-900">
                {ticket.subject}
              </span>
              <Badge
                variant="secondary"
                className={`shrink-0 text-[10px] ${STATUS_STYLES[ticket.status]}`}
              >
                {STATUS_LABELS[ticket.status]}
              </Badge>
              <Badge
                variant="secondary"
                className={`shrink-0 text-[10px] ${PRIORITY_STYLES[ticket.priority]}`}
              >
                {PRIORITY_LABELS[ticket.priority]}
              </Badge>
            </div>
            <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building2 className="size-3" />
                {ticket.businessName || "—"}
              </span>
              <span className="flex items-center gap-1">
                <User className="size-3" />
                {ticket.userName || ticket.userEmail || "—"}
              </span>
              <span dir="ltr">
                {new Date(ticket.createdAt).toLocaleDateString("he-IL")}
              </span>
            </div>
          </div>
        </div>

        {isExpanded ? (
          <ChevronUp className="size-4 shrink-0 text-slate-400" />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-slate-400" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t bg-slate-50 p-4 space-y-4">
          {/* Description */}
          <div>
            <p className="mb-1 text-xs font-medium text-slate-500">תיאור הבעיה</p>
            <p className="whitespace-pre-line rounded-lg border bg-white p-3 text-sm text-slate-700">
              {ticket.description}
            </p>
          </div>

          {/* Admin notes */}
          <div>
            <p className="mb-1 text-xs font-medium text-slate-500">
              הערות אדמין (נשלח לבעל העסק)
            </p>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="כתוב תגובה לבעל העסק..."
              rows={3}
              disabled={pending}
            />
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={handleSaveNotes}
              disabled={pending}
            >
              {pending ? (
                <Loader2 className="mr-1 size-3.5 animate-spin" />
              ) : (
                <Send className="mr-1 size-3.5" />
              )}
              שמור הערה
            </Button>
          </div>

          {/* Status actions */}
          <div>
            <p className="mb-2 text-xs font-medium text-slate-500">שנה סטטוס</p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  "OPEN",
                  "IN_PROGRESS",
                  "RESOLVED",
                  "CLOSED",
                ] as TicketStatus[]
              ).map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={ticket.status === s ? "default" : "outline"}
                  disabled={pending || ticket.status === s}
                  onClick={() => handleStatusChange(s)}
                  className="text-xs"
                >
                  {STATUS_LABELS[s]}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
