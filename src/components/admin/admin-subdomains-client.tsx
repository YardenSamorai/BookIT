"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Globe,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Trash2,
  Building2,
  MessageSquare,
} from "lucide-react";
import { approveSubdomain, rejectSubdomain, revokeSubdomain } from "@/actions/subdomain";

type SubdomainStatus = "PENDING" | "APPROVED" | "REJECTED";

interface SubdomainRequest {
  id: string;
  name: string;
  slug: string;
  customSubdomain: string | null;
  subdomainStatus: SubdomainStatus | null;
  subdomainRejectReason: string | null;
  subdomainRequestedAt: Date | null;
  updatedAt: Date;
}

const STATUS_STYLES: Record<SubdomainStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
};

const STATUS_LABELS: Record<SubdomainStatus, string> = {
  PENDING: "ממתין לאישור",
  APPROVED: "מאושר",
  REJECTED: "נדחה",
};

const TABS = [
  { key: "ALL", label: "הכל" },
  { key: "PENDING", label: "ממתינים" },
  { key: "APPROVED", label: "מאושרים" },
  { key: "REJECTED", label: "נדחו" },
];

export function AdminSubdomainsClient({
  requests,
  pendingCount,
}: {
  requests: SubdomainRequest[];
  pendingCount: number;
}) {
  const [filter, setFilter] = useState("ALL");

  const filtered =
    filter === "ALL"
      ? requests
      : requests.filter((r) => r.subdomainStatus === filter);

  const rejectedCount = requests.filter((r) => r.subdomainStatus === "REJECTED").length;

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">סאב-דומיינים</h1>
        <p className="text-sm text-muted-foreground">
          ניהול בקשות סאב-דומיין מבעלי עסקים
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">ממתינים</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">
              {requests.filter((r) => r.subdomainStatus === "APPROVED").length}
            </p>
            <p className="text-xs text-muted-foreground">מאושרים</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-500">{rejectedCount}</p>
            <p className="text-xs text-muted-foreground">נדחו</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-600">{requests.length}</p>
            <p className="text-xs text-muted-foreground">סה״כ</p>
          </CardContent>
        </Card>
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
            {tab.key === "PENDING" && pendingCount > 0 && (
              <span className="mr-1 inline-flex size-4 items-center justify-center rounded-full bg-amber-100 text-[10px] text-amber-700">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Globe className="size-10 text-slate-300" />
            <p className="text-sm text-muted-foreground">אין בקשות בקטגוריה זו</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((req) => (
            <SubdomainRow key={req.id} request={req} />
          ))}
        </div>
      )}
    </div>
  );
}

function formatDateTime(date: Date | null) {
  if (!date) return "—";
  return new Date(date).toLocaleString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SubdomainRow({ request }: { request: SubdomainRequest }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const status = request.subdomainStatus;
  const domain = (process.env.NEXT_PUBLIC_APP_DOMAIN || "bookit.co.il").replace(/^www\./, "");

  function handleApprove() {
    startTransition(async () => {
      await approveSubdomain(request.id);
      router.refresh();
    });
  }

  function handleReject() {
    startTransition(async () => {
      await rejectSubdomain(request.id, rejectReason || undefined);
      setShowRejectForm(false);
      setRejectReason("");
      router.refresh();
    });
  }

  function handleRevoke() {
    startTransition(async () => {
      await revokeSubdomain(request.id);
      router.refresh();
    });
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-slate-400" />
              <span className="text-sm font-semibold text-slate-900">
                {request.name}
              </span>
              {status && (
                <Badge
                  variant="secondary"
                  className={`text-[10px] ${STATUS_STYLES[status]}`}
                >
                  {status === "PENDING" && <Clock className="mr-1 size-3" />}
                  {status === "APPROVED" && <CheckCircle className="mr-1 size-3" />}
                  {status === "REJECTED" && <XCircle className="mr-1 size-3" />}
                  {STATUS_LABELS[status]}
                </Badge>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {request.customSubdomain && (
                <span className="font-mono" dir="ltr">
                  {request.customSubdomain}.{domain}
                </span>
              )}
              <span className="font-mono" dir="ltr">
                /{request.slug}
              </span>
              <span dir="ltr" title="תאריך בקשה">
                בקשה: {formatDateTime(request.subdomainRequestedAt)}
              </span>
              <span dir="ltr" title="עדכון אחרון">
                עדכון: {formatDateTime(request.updatedAt)}
              </span>
            </div>

            {/* Rejection reason display */}
            {status === "REJECTED" && request.subdomainRejectReason && (
              <div className="mt-2 rounded-lg border border-red-100 bg-red-50 p-2.5">
                <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-red-700">
                  <MessageSquare className="size-3" />
                  סיבת דחייה
                </div>
                <p className="text-xs text-red-800 whitespace-pre-line">
                  {request.subdomainRejectReason}
                </p>
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {status === "PENDING" && !showRejectForm && (
              <>
                <Button
                  size="sm"
                  onClick={handleApprove}
                  disabled={pending}
                  className="bg-emerald-600 text-xs hover:bg-emerald-700"
                >
                  {pending ? (
                    <Loader2 className="mr-1 size-3 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-1 size-3" />
                  )}
                  אשר
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowRejectForm(true)}
                  disabled={pending}
                  className="text-xs text-red-600 hover:bg-red-50"
                >
                  <XCircle className="mr-1 size-3" />
                  דחה
                </Button>
              </>
            )}
            {status === "APPROVED" && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleRevoke}
                disabled={pending}
                className="text-xs text-red-600 hover:bg-red-50"
              >
                {pending ? (
                  <Loader2 className="mr-1 size-3 animate-spin" />
                ) : (
                  <Trash2 className="mr-1 size-3" />
                )}
                בטל
              </Button>
            )}
          </div>
        </div>

        {/* Reject form */}
        {showRejectForm && (
          <div className="mt-3 space-y-2 rounded-lg border bg-slate-50 p-3">
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="סיבת הדחייה (אופציונלי)..."
              rows={2}
              disabled={pending}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleReject}
                disabled={pending}
                className="bg-red-600 text-xs hover:bg-red-700"
              >
                {pending ? (
                  <Loader2 className="mr-1 size-3 animate-spin" />
                ) : (
                  <XCircle className="mr-1 size-3" />
                )}
                אשר דחייה
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowRejectForm(false);
                  setRejectReason("");
                }}
                disabled={pending}
                className="text-xs"
              >
                ביטול
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
