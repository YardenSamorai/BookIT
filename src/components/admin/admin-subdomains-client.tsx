"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Globe,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Trash2,
  Building2,
} from "lucide-react";
import { approveSubdomain, rejectSubdomain, revokeSubdomain } from "@/actions/subdomain";

type SubdomainStatus = "PENDING" | "APPROVED" | "REJECTED";

interface SubdomainRequest {
  id: string;
  name: string;
  slug: string;
  customSubdomain: string | null;
  subdomainStatus: SubdomainStatus | null;
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

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">סאב-דומיינים</h1>
        <p className="text-sm text-muted-foreground">
          ניהול בקשות סאב-דומיין מבעלי עסקים
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">ממתינים לאישור</p>
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
            <p className="text-2xl font-bold text-slate-600">{requests.length}</p>
            <p className="text-xs text-muted-foreground">סה״כ בקשות</p>
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

function SubdomainRow({ request }: { request: SubdomainRequest }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
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
      await rejectSubdomain(request.id);
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
    <Card>
      <CardContent className="flex items-center justify-between p-4">
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
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="font-mono" dir="ltr">
              {request.customSubdomain}.{domain}
            </span>
            <span>·</span>
            <span className="font-mono" dir="ltr">
              /{request.slug}
            </span>
            <span>·</span>
            <span dir="ltr">
              {new Date(request.updatedAt).toLocaleDateString("he-IL")}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {status === "PENDING" && (
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
                onClick={handleReject}
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
      </CardContent>
    </Card>
  );
}
