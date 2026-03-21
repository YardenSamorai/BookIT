"use client";

import { useState, useTransition, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { updateNotificationPreferences } from "@/actions/notification-preferences";
import { updateMessageTemplate, resetMessageTemplate, toggleMessageTemplate } from "@/actions/message-templates";
import {
  MessageSquare,
  Send,
  XCircle,
  Phone,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Save,
  Check,
  Lock,
  RotateCcw,
  Edit2,
  Eye,
  Zap,
  RefreshCw,
} from "lucide-react";
import type { InferSelectModel } from "drizzle-orm";
import type { notificationLogs, messageTemplates } from "@/lib/db/schema";

type NotificationLog = InferSelectModel<typeof notificationLogs>;
type MessageTemplate = InferSelectModel<typeof messageTemplates>;

interface NotificationPrefs {
  whatsappEnabled: boolean;
  smsBookingEnabled: boolean;
  reminderHoursBefore: number;
  reminderHoursBefore2: number;
}

interface Stats {
  total: number;
  sent: number;
  failed: number;
  whatsapp: number;
  sms: number;
}

interface Props {
  logs: NotificationLog[];
  stats: Stats;
  prefs: NotificationPrefs;
  templates: MessageTemplate[];
  whatsappAllowed: boolean;
  businessPhone: string;
  locale: string;
}

const STATUS_COLORS: Record<string, string> = {
  SENT: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  DELIVERED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  QUEUED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
};

const CHANNEL_ICONS: Record<string, typeof MessageCircle> = {
  WHATSAPP: MessageCircle,
  SMS: Phone,
  EMAIL: Send,
};

const TYPE_LABELS: Record<string, string> = {
  BOOKING_CONFIRMED: "msg.tmpl_booking",
  REMINDER: "msg.tmpl_reminder",
  CANCELLATION: "msg.tmpl_cancellation",
  RESCHEDULE: "msg.tmpl_reschedule",
};

const SAMPLE_VARS: Record<string, string> = {
  customerName: "ישראל ישראלי",
  businessName: "הסטודיו שלי",
  date: "יום שלישי, 15 באפריל",
  time: "14:30",
  service: "תספורת גברים",
  staff: "דני",
};

const PAGE_SIZE = 50;

export function MessagesPageClient({
  logs,
  stats,
  prefs,
  templates,
  whatsappAllowed,
  businessPhone,
  locale,
}: Props) {
  const t = useT();
  const uiLocale = useLocale();
  const dateLocale = uiLocale === "he" ? "he-IL" : "en-US";

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Send className="size-5 text-primary" />}
          label={t("msg.total_sent" as never)}
          value={stats.sent}
        />
        <StatCard
          icon={<XCircle className="size-5 text-red-500" />}
          label={t("msg.total_failed" as never)}
          value={stats.failed}
        />
        <StatCard
          icon={<MessageCircle className="size-5 text-green-600" />}
          label={t("msg.whatsapp_count" as never)}
          value={stats.whatsapp}
        />
        <StatCard
          icon={<Phone className="size-5 text-blue-500" />}
          label={t("msg.sms_count" as never)}
          value={stats.sms}
        />
      </div>

      <Tabs defaultValue="log">
        <TabsList>
          <TabsTrigger value="log">{t("msg.tab_log" as never)}</TabsTrigger>
          <TabsTrigger value="templates">{t("msg.tab_templates" as never)}</TabsTrigger>
          <TabsTrigger value="settings">{t("msg.tab_settings" as never)}</TabsTrigger>
        </TabsList>

        <TabsContent value="log" className="mt-4">
          <MessageLogTab logs={logs} dateLocale={dateLocale} />
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <TemplatesTab templates={templates} locale={locale} />
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <SettingsTab
            prefs={prefs}
            whatsappAllowed={whatsappAllowed}
            businessPhone={businessPhone}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ─── Stats Card ────────────────────────────────────────────── */

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Message Log Tab ───────────────────────────────────────── */

function MessageLogTab({ logs, dateLocale }: { logs: NotificationLog[]; dateLocale: string }) {
  const t = useT();
  const [channelFilter, setChannelFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      if (channelFilter !== "ALL" && log.channel !== channelFilter) return false;
      if (typeFilter !== "ALL" && log.type !== typeFilter) return false;
      if (statusFilter !== "ALL" && log.status !== statusFilter) return false;
      return true;
    });
  }, [logs, channelFilter, typeFilter, statusFilter]);

  const visible = filtered.slice(0, visibleCount);

  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <MessageSquare className="size-10 text-muted-foreground" />
          <div>
            <p className="font-medium">{t("msg.no_messages" as never)}</p>
            <p className="text-sm text-muted-foreground">{t("msg.no_messages_desc" as never)}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        <Select value={channelFilter} onValueChange={(v) => setChannelFilter(v ?? "ALL")}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder={t("msg.filter_channel" as never)} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("msg.filter_all" as never)}</SelectItem>
            <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
            <SelectItem value="SMS">SMS</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "ALL")}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t("msg.filter_type" as never)} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("msg.filter_all" as never)}</SelectItem>
            <SelectItem value="BOOKING_CONFIRMED">{t("msg.type_booking" as never)}</SelectItem>
            <SelectItem value="REMINDER">{t("msg.type_reminder" as never)}</SelectItem>
            <SelectItem value="CANCELLATION">{t("msg.type_cancellation" as never)}</SelectItem>
            <SelectItem value="RESCHEDULE">{t("msg.type_reschedule" as never)}</SelectItem>
            <SelectItem value="OTP">{t("msg.type_otp" as never)}</SelectItem>
            <SelectItem value="MANUAL">{t("msg.type_manual" as never)}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "ALL")}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder={t("msg.filter_status" as never)} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("msg.filter_all" as never)}</SelectItem>
            <SelectItem value="SENT">{t("msg.status_sent" as never)}</SelectItem>
            <SelectItem value="DELIVERED">{t("msg.status_delivered" as never)}</SelectItem>
            <SelectItem value="FAILED">{t("msg.status_failed" as never)}</SelectItem>
            <SelectItem value="QUEUED">{t("msg.status_queued" as never)}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Header row */}
      <div className="hidden rounded-lg border bg-muted/50 px-4 py-2 sm:grid sm:grid-cols-6 sm:gap-4">
        <span className="text-xs font-medium text-muted-foreground">{t("msg.channel" as never)}</span>
        <span className="text-xs font-medium text-muted-foreground">{t("msg.type" as never)}</span>
        <span className="text-xs font-medium text-muted-foreground">{t("msg.recipient" as never)}</span>
        <span className="text-xs font-medium text-muted-foreground">{t("msg.message_body" as never)}</span>
        <span className="text-xs font-medium text-muted-foreground">{t("msg.status" as never)}</span>
        <span className="text-xs font-medium text-muted-foreground">{t("msg.date" as never)}</span>
      </div>

      <div className="space-y-2">
        {visible.map((log) => (
          <ExpandableLogRow key={log.id} log={log} dateLocale={dateLocale} />
        ))}
      </div>

      {visibleCount < filtered.length && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
            {t("msg.load_more" as never)} ({filtered.length - visibleCount})
          </Button>
        </div>
      )}
    </div>
  );
}

function ExpandableLogRow({ log, dateLocale }: { log: NotificationLog; dateLocale: string }) {
  const t = useT();
  const [expanded, setExpanded] = useState(false);

  const ChannelIcon = CHANNEL_ICONS[log.channel] ?? Send;
  const typeKey = `msg.type_${log.type.toLowerCase()}` as never;
  const statusKey = `msg.status_${log.status.toLowerCase()}` as never;

  const dateStr = new Date(log.createdAt).toLocaleDateString(dateLocale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const bodyPreview = log.messageBody
    ? log.messageBody.length > 60
      ? log.messageBody.substring(0, 60) + "…"
      : log.messageBody
    : "—";

  return (
    <div
      className="rounded-lg border transition-colors hover:bg-muted/30 cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex flex-col gap-2 p-3 sm:grid sm:grid-cols-6 sm:items-center sm:gap-4 sm:p-4">
        {/* Channel */}
        <div className="flex items-center gap-2">
          <ChannelIcon
            className={`size-4 ${log.channel === "WHATSAPP" ? "text-green-600" : "text-blue-500"}`}
          />
          <span className="text-sm font-medium">{log.channel}</span>
        </div>

        {/* Type */}
        <div>
          <Badge variant="secondary" className="text-xs">{t(typeKey)}</Badge>
        </div>

        {/* Recipient */}
        <div className="text-sm text-muted-foreground" dir="ltr">{log.recipient}</div>

        {/* Body preview */}
        <div className="hidden text-xs text-muted-foreground truncate sm:block">{bodyPreview}</div>

        {/* Status */}
        <div>
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[log.status] ?? ""}`}>
            {t(statusKey)}
          </span>
        </div>

        {/* Date + expand */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">{dateStr}</span>
          {expanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t px-4 pb-4 pt-3 space-y-2">
          {log.messageBody && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">{t("msg.message_body" as never)}</p>
              <div className="whitespace-pre-wrap rounded bg-muted p-3 text-sm">{log.messageBody}</div>
            </div>
          )}
          {log.providerMessageId && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">{t("msg.provider_id" as never)}:</span> <code className="text-xs">{log.providerMessageId}</code>
            </p>
          )}
          {log.errorMessage && (
            <div className="rounded bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-400">
              <span className="font-medium">{t("msg.error_details" as never)}:</span> {log.errorMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Templates Tab ─────────────────────────────────────────── */

function TemplatesTab({ templates, locale }: { templates: MessageTemplate[]; locale: string }) {
  const t = useT();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const groups: Record<string, MessageTemplate[]> = {};
    for (const tmpl of templates) {
      if (!groups[tmpl.type]) groups[tmpl.type] = [];
      groups[tmpl.type].push(tmpl);
    }
    return groups;
  }, [templates]);

  const typeOrder = ["BOOKING_CONFIRMED", "REMINDER", "CANCELLATION", "RESCHEDULE"];

  const handleEdit = useCallback((tmpl: MessageTemplate) => {
    setEditingId(tmpl.id);
    setEditBody(tmpl.body);
    setSaved(null);
  }, []);

  function handleSave() {
    if (!editingId) return;
    setSaved(null);
    startTransition(async () => {
      await updateMessageTemplate(editingId, editBody);
      setSaved(editingId);
      setEditingId(null);
    });
  }

  function handleReset(tmplId: string) {
    startTransition(async () => {
      await resetMessageTemplate(tmplId, locale as "en" | "he");
      setSaved(tmplId);
    });
  }

  function handleToggle(tmplId: string, active: boolean) {
    startTransition(async () => {
      await toggleMessageTemplate(tmplId, active);
    });
  }

  function renderPreview(body: string) {
    let preview = body;
    for (const [key, value] of Object.entries(SAMPLE_VARS)) {
      preview = preview.replaceAll(`{${key}}`, value);
    }
    return preview;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">{t("msg.tmpl_title" as never)}</h3>
        <p className="text-sm text-muted-foreground">{t("msg.tmpl_desc" as never)}</p>
      </div>

      {/* Placeholder reference */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-medium mb-2">{t("msg.tmpl_placeholders" as never)}</p>
          <div className="flex flex-wrap gap-2">
            {(["customerName", "businessName", "date", "time", "service", "staff"] as const).map((ph) => (
              <div key={ph} className="flex items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-1">
                <code className="text-xs font-mono text-primary">{`{${ph}}`}</code>
                <span className="text-xs text-muted-foreground">
                  {t(`msg.tmpl_placeholder_${ph}` as never)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Template cards by type */}
      {typeOrder.map((type) => {
        const group = grouped[type];
        if (!group) return null;
        const labelKey = TYPE_LABELS[type];
        return (
          <div key={type} className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Zap className="size-4 text-primary" />
              {t(labelKey as never)}
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {group.map((tmpl) => (
                <Card key={tmpl.id} className={!tmpl.isActive ? "opacity-60" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {tmpl.channel === "WHATSAPP" ? (
                          <MessageCircle className="size-4 text-green-600" />
                        ) : (
                          <Phone className="size-4 text-blue-500" />
                        )}
                        <span className="text-sm font-medium">{tmpl.channel}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={tmpl.isActive}
                          onCheckedChange={(v) => handleToggle(tmpl.id, v)}
                          disabled={pending}
                        />
                        <Badge variant={tmpl.isActive ? "default" : "secondary"} className="text-xs">
                          {tmpl.isActive ? t("msg.tmpl_active" as never) : t("msg.tmpl_inactive" as never)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {editingId === tmpl.id ? (
                      <>
                        <Textarea
                          value={editBody}
                          onChange={(e) => setEditBody(e.target.value)}
                          className="min-h-[120px] text-sm font-mono"
                          dir="auto"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSave} disabled={pending}>
                            {pending ? <Loader2 className="me-1 size-3 animate-spin" /> : <Save className="me-1 size-3" />}
                            {t("common.save")}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                            {t("common.cancel")}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="whitespace-pre-wrap rounded bg-muted p-3 text-sm leading-relaxed" dir="auto">
                          {tmpl.body.split(/(\{[a-zA-Z]+\})/).map((part, i) =>
                            part.match(/^\{[a-zA-Z]+\}$/) ? (
                              <span key={i} className="rounded bg-primary/10 px-1 py-0.5 text-xs font-mono text-primary">
                                {part}
                              </span>
                            ) : (
                              <span key={i}>{part}</span>
                            )
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(tmpl)} disabled={pending}>
                            <Edit2 className="me-1 size-3" />
                            {t("msg.tmpl_edit" as never)}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleReset(tmpl.id)} disabled={pending}>
                            <RotateCcw className="me-1 size-3" />
                            {t("msg.tmpl_reset" as never)}
                          </Button>
                        </div>
                        {saved === tmpl.id && (
                          <span className="flex items-center gap-1 text-xs text-green-600">
                            <Check className="size-3" />
                            {t("msg.tmpl_saved" as never)}
                          </span>
                        )}
                      </>
                    )}

                    {/* Preview panel */}
                    <details className="group">
                      <summary className="cursor-pointer text-xs text-muted-foreground flex items-center gap-1">
                        <Eye className="size-3" />
                        {t("msg.tmpl_preview" as never)}
                      </summary>
                      <div className="mt-2 whitespace-pre-wrap rounded border bg-background p-3 text-sm" dir="auto">
                        {renderPreview(editingId === tmpl.id ? editBody : tmpl.body)}
                      </div>
                    </details>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Settings Tab ──────────────────────────────────────────── */

function SettingsTab({
  prefs,
  whatsappAllowed,
  businessPhone,
}: {
  prefs: NotificationPrefs;
  whatsappAllowed: boolean;
  businessPhone: string;
}) {
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [testPending, setTestPending] = useState(false);
  const [testResult, setTestResult] = useState<"sent" | "failed" | null>(null);
  const [syncPending, setSyncPending] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const [whatsappEnabled, setWhatsappEnabled] = useState(prefs.whatsappEnabled);
  const [smsBookingEnabled, setSmsBookingEnabled] = useState(prefs.smsBookingEnabled);
  const [reminderHours, setReminderHours] = useState(prefs.reminderHoursBefore);
  const [reminderHours2, setReminderHours2] = useState(prefs.reminderHoursBefore2);

  function handleSave() {
    setSaved(false);
    startTransition(async () => {
      await updateNotificationPreferences({
        whatsappEnabled,
        smsBookingEnabled,
        reminderHoursBefore: reminderHours,
        reminderHoursBefore2: reminderHours2 > 0 ? reminderHours2 : null,
      });
      setSaved(true);
    });
  }

  async function handleTestMessage() {
    if (!businessPhone) return;
    setTestPending(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/test-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: businessPhone }),
      });
      setTestResult(res.ok ? "sent" : "failed");
    } catch {
      setTestResult("failed");
    } finally {
      setTestPending(false);
    }
  }

  const router = useRouter();

  async function handleSyncMessages() {
    setSyncPending(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/cron/sync-messages");
      if (res.ok) {
        const data = await res.json();
        setSyncResult(`${data.synced ?? 0}`);
        router.refresh();
      }
    } catch {
      // silently ignore
    } finally {
      setSyncPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="size-4 text-green-600" />
            {t("settings.notif_title" as never)}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t("settings.notif_desc" as never)}</p>
        </CardHeader>
        <CardContent className="space-y-5">
          {!whatsappAllowed && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <Lock className="size-4 shrink-0" />
              {t("settings.notif_upgrade" as never)}
            </div>
          )}

          {/* WhatsApp toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">{t("settings.notif_whatsapp" as never)}</Label>
              <p className="text-xs text-muted-foreground">{t("settings.notif_whatsapp_desc" as never)}</p>
            </div>
            <Switch
              checked={whatsappEnabled}
              onCheckedChange={(v) => { setWhatsappEnabled(v); setSaved(false); }}
              disabled={!whatsappAllowed || pending}
            />
          </div>

          {/* SMS toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">{t("msg.settings_sms_booking" as never)}</Label>
              <p className="text-xs text-muted-foreground">{t("msg.settings_sms_booking_desc" as never)}</p>
            </div>
            <Switch
              checked={smsBookingEnabled}
              onCheckedChange={(v) => { setSmsBookingEnabled(v); setSaved(false); }}
              disabled={pending}
            />
          </div>

          {/* Reminder #1 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("settings.notif_reminder_hours" as never)}</Label>
            <p className="text-xs text-muted-foreground">{t("settings.notif_reminder_desc" as never)}</p>
            <Input
              type="number"
              min={1}
              max={72}
              value={reminderHours}
              onChange={(e) => { setReminderHours(Number(e.target.value)); setSaved(false); }}
              disabled={!whatsappAllowed || pending}
              className="max-w-[120px]"
            />
          </div>

          {/* Reminder #2 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("msg.settings_reminder2" as never)}</Label>
            <p className="text-xs text-muted-foreground">{t("msg.settings_reminder2_desc" as never)}</p>
            <Input
              type="number"
              min={0}
              max={72}
              value={reminderHours2}
              onChange={(e) => { setReminderHours2(Number(e.target.value)); setSaved(false); }}
              disabled={!whatsappAllowed || pending}
              className="max-w-[120px]"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={handleSave} disabled={pending || !whatsappAllowed}>
          {pending ? <Loader2 className="me-2 size-4 animate-spin" /> : <Save className="me-2 size-4" />}
          {t("settings.save")}
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <Check className="size-4" />
            {t("settings.notif_saved" as never)}
          </span>
        )}
      </div>

      {/* Test message + Sync */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4 space-y-3">
            <div>
              <p className="text-sm font-medium">{t("msg.settings_test" as never)}</p>
              <p className="text-xs text-muted-foreground">{t("msg.settings_test_desc" as never)}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestMessage}
              disabled={testPending || !businessPhone || !whatsappAllowed}
            >
              {testPending ? <Loader2 className="me-1 size-3 animate-spin" /> : <Send className="me-1 size-3" />}
              {t("msg.settings_test" as never)}
            </Button>
            {testResult === "sent" && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <Check className="size-3" />{t("msg.settings_test_sent" as never)}
              </p>
            )}
            {testResult === "failed" && (
              <p className="text-xs text-red-600">{t("msg.settings_test_failed" as never)}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div>
              <p className="text-sm font-medium">{t("msg.sync_messages" as never)}</p>
              <p className="text-xs text-muted-foreground">{t("msg.sync_desc" as never)}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSyncMessages} disabled={syncPending}>
              {syncPending ? <Loader2 className="me-1 size-3 animate-spin" /> : <RefreshCw className="me-1 size-3" />}
              {t("msg.sync_messages" as never)}
            </Button>
            {syncResult && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <Check className="size-3" />{t("msg.sync_done" as never).replace("{count}", syncResult)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
