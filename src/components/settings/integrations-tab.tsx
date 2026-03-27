"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Check,
  Loader2,
  Unlink,
  Plus,
  ChevronDown,
} from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";

interface CalendarConnection {
  id: string;
  staffId: string | null;
  googleEmail: string;
  createdAt: Date;
}

interface StaffMember {
  id: string;
  name: string;
}

interface Props {
  connections: CalendarConnection[];
  staff: StaffMember[];
}

export function IntegrationsTab({ connections, staff }: Props) {
  const t = useT();

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t("settings.integrations_desc" as never)}
      </p>

      <GoogleCalendarCard connections={connections} staff={staff} />

      {/* Future integrations will go here */}
    </div>
  );
}

function GoogleCalendarCard({
  connections,
  staff,
}: {
  connections: CalendarConnection[];
  staff: StaffMember[];
}) {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(connections.length > 0);
  const [pending, startTransition] = useTransition();
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const ownerConnection = connections.find((c) => !c.staffId);
  const staffConnections = connections.filter((c) => c.staffId);
  const unconnectedStaff = staff.filter(
    (s) => !staffConnections.some((c) => c.staffId === s.id)
  );

  const connectedCount = connections.length;

  function handleConnect(staffId?: string) {
    const url = staffId
      ? `/api/gcal/connect?staffId=${staffId}`
      : "/api/gcal/connect";
    window.location.href = url;
  }

  async function handleDisconnect(staffId: string | null) {
    const key = staffId || "owner";
    setDisconnecting(key);
    try {
      await fetch("/api/gcal/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId }),
      });
      startTransition(() => router.refresh());
    } finally {
      setDisconnecting(null);
    }
  }

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-start transition-colors hover:bg-slate-50"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50">
            <Calendar className="size-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Google Calendar
            </p>
            <p className="text-xs text-muted-foreground">
              {t("settings.gcal_desc" as never)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {connectedCount > 0 && (
            <Badge
              variant="secondary"
              className="bg-emerald-50 text-emerald-700"
            >
              <Check className="mr-1 size-3" />
              {connectedCount} {t("settings.gcal_connected" as never)}
            </Badge>
          )}
          <ChevronDown
            className={`size-4 text-slate-400 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {open && (
        <CardContent className="border-t pt-4 space-y-3">
          {/* Owner connection */}
          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div>
              <p className="text-sm font-medium">
                {t("settings.gcal_owner" as never)}
              </p>
              {ownerConnection ? (
                <div className="mt-0.5 flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-emerald-50 text-emerald-700 text-[10px]"
                  >
                    <Check className="mr-1 size-2.5" />
                    {t("settings.gcal_connected" as never)}
                  </Badge>
                  <span className="text-xs text-muted-foreground" dir="ltr">
                    {ownerConnection.googleEmail}
                  </span>
                </div>
              ) : (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("settings.gcal_not_connected" as never)}
                </p>
              )}
            </div>
            {ownerConnection ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDisconnect(null)}
                disabled={pending || disconnecting === "owner"}
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                {disconnecting === "owner" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Unlink className="mr-1 size-3.5" />
                )}
                {t("settings.gcal_disconnect" as never)}
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => handleConnect()}
                disabled={pending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <GoogleIcon />
                {t("settings.gcal_connect" as never)}
              </Button>
            )}
          </div>

          {/* Staff connections */}
          {staff.length > 0 && (
            <>
              <p className="text-xs font-medium text-slate-500 pt-1">
                {t("settings.gcal_staff" as never)}
              </p>

              {staffConnections.map((conn) => {
                const staffMember = staff.find((s) => s.id === conn.staffId);
                return (
                  <div
                    key={conn.id}
                    className="flex items-center justify-between rounded-lg border px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {staffMember?.name || "—"}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="bg-emerald-50 text-emerald-700 text-[10px]"
                        >
                          <Check className="mr-1 size-2.5" />
                          {t("settings.gcal_connected" as never)}
                        </Badge>
                        <span
                          className="text-xs text-muted-foreground"
                          dir="ltr"
                        >
                          {conn.googleEmail}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect(conn.staffId)}
                      disabled={
                        pending || disconnecting === (conn.staffId || "")
                      }
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      {disconnecting === conn.staffId ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Unlink className="mr-1 size-3.5" />
                      )}
                      {t("settings.gcal_disconnect" as never)}
                    </Button>
                  </div>
                );
              })}

              {unconnectedStaff.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border border-dashed px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-600">
                      {s.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("settings.gcal_not_connected" as never)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleConnect(s.id)}
                    disabled={pending}
                  >
                    <Plus className="mr-1 size-3.5" />
                    {t("settings.gcal_connect" as never)}
                  </Button>
                </div>
              ))}
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function GoogleIcon() {
  return (
    <svg className="mr-1.5 size-4" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
