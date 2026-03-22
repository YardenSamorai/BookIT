"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n/locale-context";

interface UsageEntry {
  id: string;
  action: string;
  deltaSessions: number;
  actorType: string;
  notes: string | null;
  createdAt: Date;
  cardName: string;
  customerName: string | null;
  serviceName: string | null;
}

function getActionLabel(action: string, t: ReturnType<typeof useT>) {
  const map: Record<string, string> = {
    ACTIVATED: t("card.action_activated"),
    USED: t("card.action_used"),
    RESTORED: t("card.action_restored"),
    MANUAL_ADD: t("card.action_manual_add"),
    MANUAL_DEDUCT: t("card.action_manual_deduct"),
    EXPIRED: t("card.action_expired"),
    CANCELLED: t("card.action_cancelled"),
  };
  return map[action] ?? action;
}

function getDeltaColor(delta: number) {
  if (delta < 0) return "text-red-600";
  if (delta > 0) return "text-green-600";
  return "text-muted-foreground";
}

interface CardUsageTableProps {
  entries: UsageEntry[];
}

export function CardUsageTable({ entries }: CardUsageTableProps) {
  const t = useT();

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {t("card.usage_history")} — {t("common.empty")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-start font-medium">
                  {t("common.date")}
                </th>
                <th className="px-4 py-2.5 text-start font-medium">
                  {t("card.name")}
                </th>
                <th className="px-4 py-2.5 text-start font-medium">
                  {t("cust.title")}
                </th>
                <th className="px-4 py-2.5 text-start font-medium">
                  Action
                </th>
                <th className="px-4 py-2.5 text-end font-medium">
                  Sessions
                </th>
                <th className="px-4 py-2.5 text-start font-medium">
                  {t("common.notes")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(entry.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 font-medium">{entry.cardName}</td>
                  <td className="px-4 py-2.5">{entry.customerName || "—"}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className="text-xs">
                      {getActionLabel(entry.action, t)}
                    </Badge>
                    {entry.serviceName && (
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        ({entry.serviceName})
                      </span>
                    )}
                  </td>
                  <td className={`px-4 py-2.5 text-end font-mono ${getDeltaColor(entry.deltaSessions)}`}>
                    {entry.deltaSessions > 0 ? "+" : ""}
                    {entry.deltaSessions}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[200px] truncate">
                    {entry.notes || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
