import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { notificationLogs } from "@/lib/db/schema";
import { sql, eq, and, gte, count, desc } from "drizzle-orm";
import {
  Activity,
  Database,
  MessageSquare,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

export const dynamic = "force-dynamic";

type HealthState = "healthy" | "unhealthy" | "not_configured";

type ServiceCheck = {
  state: HealthState;
  responseMs?: number;
};

async function checkDatabase(): Promise<ServiceCheck> {
  const t0 = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    return { state: "healthy", responseMs: Date.now() - t0 };
  } catch {
    return { state: "unhealthy", responseMs: Date.now() - t0 };
  }
}

async function checkTwilio(): Promise<ServiceCheck> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid) {
    return { state: "not_configured" };
  }
  if (!authToken) {
    return { state: "unhealthy" };
  }

  const t0 = Date.now();
  try {
    const basic = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`,
      {
        headers: { Authorization: `Basic ${basic}` },
        cache: "no-store",
      }
    );
    const responseMs = Date.now() - t0;
    if (res.status === 200) {
      return { state: "healthy", responseMs };
    }
    return { state: "unhealthy", responseMs };
  } catch {
    return { state: "unhealthy", responseMs: Date.now() - t0 };
  }
}

function checkGoogleCalendar(): ServiceCheck {
  return process.env.GOOGLE_CLIENT_ID
    ? { state: "healthy" }
    : { state: "not_configured" };
}

async function getRecentFailedNotifications(): Promise<{
  count: number;
  recent: { channel: string; type: string; createdAt: Date | null }[];
  loadError: boolean;
}> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  try {
    const [countRow] = await db
      .select({ c: count() })
      .from(notificationLogs)
      .where(
        and(eq(notificationLogs.status, "FAILED"), gte(notificationLogs.createdAt, since))
      );

    const recent = await db
      .select({
        channel: notificationLogs.channel,
        type: notificationLogs.type,
        createdAt: notificationLogs.createdAt,
      })
      .from(notificationLogs)
      .where(
        and(eq(notificationLogs.status, "FAILED"), gte(notificationLogs.createdAt, since))
      )
      .orderBy(desc(notificationLogs.createdAt))
      .limit(5);

    return {
      count: Number(countRow?.c ?? 0),
      recent,
      loadError: false,
    };
  } catch {
    return { count: 0, recent: [], loadError: true };
  }
}

function statusBadge(state: HealthState) {
  switch (state) {
    case "healthy":
      return <Badge className="bg-emerald-600 hover:bg-emerald-600">תקין</Badge>;
    case "unhealthy":
      return <Badge variant="destructive">שגיאה</Badge>;
    case "not_configured":
      return (
        <Badge className="bg-amber-500 text-white hover:bg-amber-500">לא מוגדר</Badge>
      );
  }
}

function StatusIcon({ state }: { state: HealthState }) {
  const classHealthy = "size-10 text-emerald-600";
  const classUnhealthy = "size-10 text-red-600";
  const classDegraded = "size-10 text-amber-500";

  switch (state) {
    case "healthy":
      return <CheckCircle2 className={classHealthy} aria-hidden />;
    case "unhealthy":
      return <XCircle className={classUnhealthy} aria-hidden />;
    case "not_configured":
      return <Clock className={classDegraded} aria-hidden />;
  }
}

function HealthServiceCard({
  title,
  serviceIcon: ServiceIcon,
  check,
  checkedAt,
  showResponseTime,
}: {
  title: string;
  serviceIcon: typeof Database;
  check: ServiceCheck;
  checkedAt: Date;
  showResponseTime?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-slate-100 p-2.5">
            <ServiceIcon className="size-5 text-slate-700" aria-hidden />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            {statusBadge(check.state)}
          </div>
        </div>
        <StatusIcon state={check.state} />
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        {showResponseTime ? (
          <p>
            <span className="font-medium text-slate-700">זמן תגובה: </span>
            {check.responseMs != null ? `${check.responseMs} ms` : "—"}
          </p>
        ) : (
          check.responseMs != null && (
            <p>
              <span className="font-medium text-slate-700">זמן תגובה: </span>
              {check.responseMs} ms
            </p>
          )
        )}
        <p>
          <span className="font-medium text-slate-700">נבדק לאחרונה: </span>
          {checkedAt.toLocaleString("he-IL", {
            dateStyle: "short",
            timeStyle: "medium",
          })}
        </p>
      </CardContent>
    </Card>
  );
}

export default async function AdminHealthPage() {
  await requireSuperAdmin();

  const checkedAt = new Date();

  const [dbCheck, twilioCheck, failedNotifications] = await Promise.all([
    checkDatabase(),
    checkTwilio(),
    getRecentFailedNotifications(),
  ]);

  const googleCheck = checkGoogleCalendar();

  return (
    <div dir="rtl" className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-slate-900 p-2.5">
          <Activity className="size-6 text-white" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">בריאות מערכת</h1>
          <p className="text-sm text-muted-foreground">
            סטטוס שירותים ומוניטורינג בסיסי
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <HealthServiceCard
          title="מסד נתונים"
          serviceIcon={Database}
          check={dbCheck}
          checkedAt={checkedAt}
          showResponseTime
        />
        <HealthServiceCard
          title="WhatsApp (Twilio)"
          serviceIcon={MessageSquare}
          check={twilioCheck}
          checkedAt={checkedAt}
        />
        <HealthServiceCard
          title="Google Calendar"
          serviceIcon={Calendar}
          check={googleCheck}
          checkedAt={checkedAt}
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <XCircle className="size-4 text-red-500" aria-hidden />
            שגיאות אחרונות
          </CardTitle>
          <p className="text-sm font-normal text-muted-foreground">
            התראות שנכשלו ב־24 השעות האחרונות (לוג התראות)
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {failedNotifications.loadError ? (
            <p className="text-sm text-red-600">
              לא ניתן לטעון נתוני שגיאות. בדוק את חיבור מסד הנתונים.
            </p>
          ) : (
            <>
              <p className="text-lg font-semibold tabular-nums text-slate-900">
                סה&quot;כ כשלונות: {failedNotifications.count.toLocaleString("he-IL")}
              </p>
              {failedNotifications.recent.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  אין רשומות כשל בטווח זה.
                </p>
              ) : (
                <div className="divide-y rounded-lg border">
                  {failedNotifications.recent.map((row, idx) => (
                    <div
                      key={`${idx}-${row.createdAt?.toISOString() ?? ""}-${row.channel}`}
                      className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm"
                    >
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{row.channel}</Badge>
                        <Badge variant="secondary">{row.type}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {row.createdAt
                          ? new Date(row.createdAt).toLocaleString("he-IL", {
                              dateStyle: "short",
                              timeStyle: "medium",
                            })
                          : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
