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
} from "@/components/ui/select";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { updateNotificationPreferences } from "@/actions/notification-preferences";
import { updateMessageTemplate, resetMessageTemplate, toggleMessageTemplate } from "@/actions/message-templates";
import { syncTwilioMessages } from "@/actions/sync-messages";
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
  CheckCircle2,
  AlertCircle,
  Bell,
  Clock,
  Shield,
  Plus,
  Trash2,
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
  notificationPhones: string[];
}

interface Stats {
  total: number;
  sent: number;
  failed: number;
  whatsapp: number;
  sms: number;
}

interface WaConfig {
  number: string;
  templates: Record<string, string>;
}

interface Props {
  logs: NotificationLog[];
  stats: Stats;
  prefs: NotificationPrefs;
  templates: MessageTemplate[];
  whatsappAllowed: boolean;
  businessPhone: string;
  locale: string;
  phoneToName?: Record<string, string>;
  waConfig?: WaConfig;
  quota?: { used: number; limit: number };
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
  BOOKING_OWNER: "msg.tmpl_booking_owner",
  REMINDER: "msg.tmpl_reminder",
  CANCELLATION: "msg.tmpl_cancellation",
  RESCHEDULE: "msg.tmpl_reschedule",
  STAFF_NEW_BOOKING: "msg.type_staff_new_booking",
  STAFF_CANCELLATION: "msg.type_staff_cancellation",
  STAFF_RESCHEDULE: "msg.type_staff_reschedule",
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

function friendlyLogBody(body: string | null): string {
  if (!body) return "—";
  if (body.startsWith("[Template:")) {
    return body
      .replace(/\[Template:\s*HX[a-f0-9]+\]\s*vars:\s*/, "")
      .replace(/^{/, "")
      .replace(/}$/, "")
      .replace(/"(\d+)":"([^"]+)"/g, (_, _k, v) => v)
      .replace(/,/g, " · ");
  }
  return body;
}

export function MessagesPageClient({
  logs,
  stats,
  prefs,
  templates,
  whatsappAllowed,
  businessPhone,
  locale,
  phoneToName = {},
  waConfig,
  quota,
}: Props) {
  const t = useT();
  const uiLocale = useLocale();
  const dateLocale = uiLocale === "he" ? "he-IL" : "en-US";

  const configuredTemplateCount = waConfig
    ? Object.values(waConfig.templates).filter(Boolean).length
    : 0;

  const quotaPct = quota && quota.limit > 0 && quota.limit < 999999
    ? Math.min(100, Math.round((quota.used / quota.limit) * 100))
    : null;

  return (
    <div className="space-y-6">
      {/* ─── Quota Banner ─── */}
      {quota && quota.limit < 999999 && (
        <Card className={`border ${quotaPct !== null && quotaPct >= 90 ? "border-red-200 bg-red-50/50" : quotaPct !== null && quotaPct >= 70 ? "border-amber-200 bg-amber-50/50" : ""}`}>
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">
                  {t("msg.quota_title" as never)}
                </span>
                <span className="text-sm tabular-nums text-slate-600">
                  <strong>{quota.used}</strong> / {quota.limit}
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full transition-all ${
                    quotaPct !== null && quotaPct >= 90
                      ? "bg-red-500"
                      : quotaPct !== null && quotaPct >= 70
                        ? "bg-amber-400"
                        : "bg-blue-500"
                  }`}
                  style={{ width: `${quotaPct ?? 0}%` }}
                />
              </div>
              {quotaPct !== null && quotaPct >= 90 && (
                <p className="text-xs text-red-600 font-medium">
                  {quota.used >= quota.limit
                    ? t("msg.quota_exhausted" as never)
                    : t("msg.quota_almost" as never)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Stats Row ─── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Send className="size-5" />}
          iconBg="bg-primary/10 text-primary"
          label={t("msg.total_sent" as never)}
          value={stats.sent}
        />
        <StatCard
          icon={<XCircle className="size-5" />}
          iconBg="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
          label={t("msg.total_failed" as never)}
          value={stats.failed}
        />
        <StatCard
          icon={<MessageCircle className="size-5" />}
          iconBg="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
          label={t("msg.whatsapp_count" as never)}
          value={stats.whatsapp}
        />
        <StatCard
          icon={<Phone className="size-5" />}
          iconBg="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          label={t("msg.sms_count" as never)}
          value={stats.sms}
        />
      </div>

      {/* ─── Tabs ─── */}
      <Tabs defaultValue="log">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="log" className="flex-1 sm:flex-none gap-1.5">
            <MessageSquare className="size-3.5" />
            {t("msg.tab_log" as never)}
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex-1 sm:flex-none gap-1.5">
            <Zap className="size-3.5" />
            {t("msg.tab_templates" as never)}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex-1 sm:flex-none gap-1.5">
            <Shield className="size-3.5" />
            {t("msg.tab_settings" as never)}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="log" className="mt-4">
          <MessageLogTab logs={logs} dateLocale={dateLocale} phoneToName={phoneToName} />
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <TemplatesTab templates={templates} locale={locale} waConfig={waConfig} />
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <SettingsTab
            prefs={prefs}
            whatsappAllowed={whatsappAllowed}
            businessPhone={businessPhone}
            waConfig={waConfig}
            configuredTemplateCount={configuredTemplateCount}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ─── Stats Card ─── */

function StatCard({
  icon,
  iconBg,
  label,
  value,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: number;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-center gap-4 p-4">
        <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Message Log Tab ─── */

function getFilterLabel(
  t: ReturnType<typeof useT>,
  filter: string,
  type: "channel" | "type" | "status"
): string {
  if (filter === "ALL") return t("msg.filter_all" as never);
  if (type === "channel") return filter;
  if (type === "type") {
    const key = `msg.type_${filter.toLowerCase()}` as never;
    return t(key);
  }
  const key = `msg.status_${filter.toLowerCase()}` as never;
  return t(key);
}

function MessageLogTab({
  logs,
  dateLocale,
  phoneToName,
}: {
  logs: NotificationLog[];
  dateLocale: string;
  phoneToName: Record<string, string>;
}) {
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
          <div className="flex size-14 items-center justify-center rounded-full bg-muted">
            <MessageSquare className="size-7 text-muted-foreground" />
          </div>
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
      <div className="flex flex-wrap gap-2 rounded-lg border bg-muted/30 p-3">
        <Select value={channelFilter} onValueChange={(v) => { setChannelFilter(v ?? "ALL"); setVisibleCount(PAGE_SIZE); }}>
          <SelectTrigger className="w-[130px] bg-background">
            <span className="truncate">{getFilterLabel(t, channelFilter, "channel")}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("msg.filter_all" as never)}</SelectItem>
            <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
            <SelectItem value="SMS">SMS</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v ?? "ALL"); setVisibleCount(PAGE_SIZE); }}>
          <SelectTrigger className="w-[160px] bg-background">
            <span className="truncate">{getFilterLabel(t, typeFilter, "type")}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("msg.filter_all" as never)}</SelectItem>
            <SelectItem value="BOOKING_CONFIRMED">{t("msg.type_booking" as never)}</SelectItem>
            <SelectItem value="BOOKING_OWNER">{t("msg.type_booking_owner" as never)}</SelectItem>
            <SelectItem value="REMINDER">{t("msg.type_reminder" as never)}</SelectItem>
            <SelectItem value="CANCELLATION">{t("msg.type_cancellation" as never)}</SelectItem>
            <SelectItem value="RESCHEDULE">{t("msg.type_reschedule" as never)}</SelectItem>
            <SelectItem value="STAFF_NEW_BOOKING">{t("msg.type_staff_new_booking" as never)}</SelectItem>
            <SelectItem value="STAFF_CANCELLATION">{t("msg.type_staff_cancellation" as never)}</SelectItem>
            <SelectItem value="STAFF_RESCHEDULE">{t("msg.type_staff_reschedule" as never)}</SelectItem>
            <SelectItem value="OTP">{t("msg.type_otp" as never)}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? "ALL"); setVisibleCount(PAGE_SIZE); }}>
          <SelectTrigger className="w-[130px] bg-background">
            <span className="truncate">{getFilterLabel(t, statusFilter, "status")}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("msg.filter_all" as never)}</SelectItem>
            <SelectItem value="SENT">{t("msg.status_sent" as never)}</SelectItem>
            <SelectItem value="DELIVERED">{t("msg.status_delivered" as never)}</SelectItem>
            <SelectItem value="FAILED">{t("msg.status_failed" as never)}</SelectItem>
            <SelectItem value="QUEUED">{t("msg.status_queued" as never)}</SelectItem>
          </SelectContent>
        </Select>

        {(channelFilter !== "ALL" || typeFilter !== "ALL" || statusFilter !== "ALL") && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-xs"
            onClick={() => { setChannelFilter("ALL"); setTypeFilter("ALL"); setStatusFilter("ALL"); }}
          >
            {t("cls.filter_clear" as never)}
          </Button>
        )}
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground px-1">
        {filtered.length} / {logs.length}
      </p>

      {/* Log rows */}
      <div className="space-y-2">
        {visible.map((log) => (
          <ExpandableLogRow key={log.id} log={log} dateLocale={dateLocale} phoneToName={phoneToName} />
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

function resolveRecipientName(
  recipient: string,
  phoneToName: Record<string, string>
): string | undefined {
  const clean = recipient.replace(/^whatsapp:/, "").replace(/[\s\-()]/g, "");
  if (phoneToName[clean]) return phoneToName[clean];
  if (clean.startsWith("+972")) {
    const local = "0" + clean.slice(4);
    if (phoneToName[local]) return phoneToName[local];
  }
  return undefined;
}

function ExpandableLogRow({
  log,
  dateLocale,
  phoneToName,
}: {
  log: NotificationLog;
  dateLocale: string;
  phoneToName: Record<string, string>;
}) {
  const t = useT();
  const [expanded, setExpanded] = useState(false);

  const ChannelIcon = CHANNEL_ICONS[log.channel] ?? Send;
  const typeKey = TYPE_LABELS[log.type] ?? `msg.type_${log.type.toLowerCase()}`;
  const statusKey = `msg.status_${log.status.toLowerCase()}` as never;

  const dateStr = new Date(log.createdAt).toLocaleDateString(dateLocale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const isTemplate = log.messageBody?.startsWith("[Template:");
  const bodyPreview = isTemplate
    ? t("msg.template_message" as never)
    : log.messageBody
      ? log.messageBody.length > 50 ? log.messageBody.substring(0, 50) + "…" : log.messageBody
      : "—";

  const customerName = resolveRecipientName(log.recipient, phoneToName);
  const displayPhone = log.recipient.replace(/^whatsapp:/, "");

  return (
    <div
      className="rounded-lg border transition-colors hover:bg-muted/30 cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex flex-col gap-2 p-3 sm:grid sm:grid-cols-[auto_1fr_1fr_auto_auto] sm:items-center sm:gap-4 sm:p-4">
        {/* Channel + Type */}
        <div className="flex items-center gap-2">
          <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
            log.channel === "WHATSAPP" ? "bg-green-100 dark:bg-green-900/30" : "bg-blue-100 dark:bg-blue-900/30"
          }`}>
            <ChannelIcon className={`size-4 ${log.channel === "WHATSAPP" ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"}`} />
          </div>
          <Badge variant="secondary" className="text-[10px] shrink-0">
            {t(typeKey as never)}
          </Badge>
        </div>

        {/* Recipient */}
        <div className="min-w-0">
          {customerName && (
            <p className="text-sm font-medium truncate">{customerName}</p>
          )}
          <p className={`text-xs ${customerName ? "text-muted-foreground" : "text-sm font-medium"} truncate`} dir="ltr">
            {displayPhone}
          </p>
        </div>

        {/* Body preview */}
        <div className="hidden text-xs text-muted-foreground truncate sm:block">
          {bodyPreview}
        </div>

        {/* Status */}
        <span className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[log.status] ?? ""}`}>
          {t(statusKey)}
        </span>

        {/* Date + expand */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">{dateStr}</span>
          {expanded ? <ChevronUp className="size-3.5 text-muted-foreground" /> : <ChevronDown className="size-3.5 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t px-4 pb-4 pt-3 space-y-2">
          {log.messageBody && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">{t("msg.message_body" as never)}</p>
              <div className="whitespace-pre-wrap rounded-lg bg-muted p-3 text-sm leading-relaxed">
                {friendlyLogBody(log.messageBody)}
              </div>
            </div>
          )}
          {log.providerMessageId && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">{t("msg.provider_id" as never)}:</span>{" "}
              <code className="text-[10px] bg-muted px-1 py-0.5 rounded">{log.providerMessageId}</code>
            </p>
          )}
          {log.errorMessage && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-400">
              <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
              <span>{log.errorMessage}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Templates Tab ─── */

const WA_TEMPLATE_TYPES = [
  { type: "BOOKING_CONFIRMED", key: "msg.tmpl_booking" },
  { type: "BOOKING_OWNER", key: "msg.tmpl_booking_owner" },
  { type: "REMINDER", key: "msg.tmpl_reminder" },
  { type: "CANCELLATION", key: "msg.tmpl_cancellation" },
  { type: "RESCHEDULE", key: "msg.tmpl_reschedule" },
] as const;

const SMS_TYPE_ORDER = ["BOOKING_CONFIRMED", "BOOKING_OWNER", "REMINDER", "CANCELLATION", "RESCHEDULE"];

function TemplatesTab({
  templates,
  locale,
  waConfig,
}: {
  templates: MessageTemplate[];
  locale: string;
  waConfig?: WaConfig;
}) {
  const t = useT();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState<string | null>(null);

  const smsTemplates = useMemo(() => {
    const groups: Record<string, MessageTemplate[]> = {};
    for (const tmpl of templates) {
      if (tmpl.channel !== "SMS") continue;
      if (!groups[tmpl.type]) groups[tmpl.type] = [];
      groups[tmpl.type].push(tmpl);
    }
    return groups;
  }, [templates]);

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
    <div className="space-y-8">
      {/* ── WhatsApp Templates (read-only) ── */}
      <section className="space-y-4">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2">
            <MessageCircle className="size-4 text-green-600" />
            {t("msg.tmpl_whatsapp_section" as never)}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{t("msg.tmpl_wa_readonly" as never)}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {WA_TEMPLATE_TYPES.map(({ type, key }) => {
            const sid = waConfig?.templates[type];
            const configured = !!sid;
            return (
              <Card key={type} className={`overflow-hidden ${!configured ? "opacity-70" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">{t(key as never)}</span>
                    {configured ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-[10px] gap-1">
                        <CheckCircle2 className="size-3" />
                        {t("msg.wa_template_configured" as never)}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <AlertCircle className="size-3" />
                        {t("msg.wa_template_missing" as never)}
                      </Badge>
                    )}
                  </div>
                  {configured && (
                    <p className="text-[10px] text-muted-foreground font-mono truncate" dir="ltr">
                      {sid}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground flex items-center gap-1.5 px-1">
          <AlertCircle className="size-3 shrink-0" />
          {t("msg.wa_managed_note" as never)}
        </p>
      </section>

      {/* ── SMS Templates (editable) ── */}
      <section className="space-y-4">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Phone className="size-4 text-blue-500" />
            {t("msg.tmpl_sms_section" as never)}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{t("msg.tmpl_sms_editable" as never)}</p>
        </div>

        {/* Placeholder reference */}
        <Card>
          <CardContent className="p-3">
            <p className="text-xs font-medium mb-2">{t("msg.tmpl_placeholders" as never)}</p>
            <div className="flex flex-wrap gap-1.5">
              {(["customerName", "businessName", "date", "time", "service", "staff"] as const).map((ph) => (
                <div key={ph} className="flex items-center gap-1 rounded border bg-muted/50 px-1.5 py-0.5">
                  <code className="text-[10px] font-mono text-primary">{`{${ph}}`}</code>
                  <span className="text-[10px] text-muted-foreground">
                    {t(`msg.tmpl_placeholder_${ph}` as never)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* SMS template cards by type */}
        {SMS_TYPE_ORDER.map((type) => {
          const group = smsTemplates[type];
          if (!group?.length) return null;
          const labelKey = TYPE_LABELS[type];
          return (
            <div key={type} className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Zap className="size-3.5 text-primary" />
                {t(labelKey as never)}
              </h4>
              <div className="grid gap-3 sm:grid-cols-2">
                {group.map((tmpl) => (
                  <Card key={tmpl.id} className={`overflow-hidden ${!tmpl.isActive ? "opacity-50" : ""}`}>
                    <CardHeader className="p-3 pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Phone className="size-3.5 text-blue-500" />
                          <span className="text-xs font-medium">SMS</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={tmpl.isActive}
                            onCheckedChange={(v) => handleToggle(tmpl.id, v)}
                            disabled={pending}
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-3">
                      {editingId === tmpl.id ? (
                        <>
                          <Textarea
                            value={editBody}
                            onChange={(e) => setEditBody(e.target.value)}
                            className="min-h-[100px] text-xs font-mono"
                            dir="auto"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" className="h-7 text-xs" onClick={handleSave} disabled={pending}>
                              {pending ? <Loader2 className="me-1 size-3 animate-spin" /> : <Save className="me-1 size-3" />}
                              {t("common.save")}
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingId(null)}>
                              {t("common.cancel")}
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="whitespace-pre-wrap rounded-lg bg-muted p-2.5 text-xs leading-relaxed" dir="auto">
                            {tmpl.body.split(/(\{[a-zA-Z]+\})/).map((part, i) =>
                              part.match(/^\{[a-zA-Z]+\}$/) ? (
                                <span key={i} className="rounded bg-primary/10 px-1 py-0.5 text-[10px] font-mono text-primary">
                                  {part}
                                </span>
                              ) : (
                                <span key={i}>{part}</span>
                              )
                            )}
                          </div>
                          <div className="flex gap-1.5">
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleEdit(tmpl)} disabled={pending}>
                              <Edit2 className="me-1 size-3" />
                              {t("msg.tmpl_edit" as never)}
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleReset(tmpl.id)} disabled={pending}>
                              <RotateCcw className="me-1 size-3" />
                              {t("msg.tmpl_reset" as never)}
                            </Button>
                          </div>
                          {saved === tmpl.id && (
                            <span className="flex items-center gap-1 text-[10px] text-green-600">
                              <Check className="size-3" />
                              {t("msg.tmpl_saved" as never)}
                            </span>
                          )}
                        </>
                      )}

                      <details className="group">
                        <summary className="cursor-pointer text-[10px] text-muted-foreground flex items-center gap-1">
                          <Eye className="size-3" />
                          {t("msg.tmpl_preview" as never)}
                        </summary>
                        <div className="mt-2 whitespace-pre-wrap rounded-lg border bg-background p-2.5 text-xs" dir="auto">
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
      </section>
    </div>
  );
}

/* ─── Settings Tab ─── */

function SettingsTab({
  prefs,
  whatsappAllowed,
  businessPhone,
  waConfig,
  configuredTemplateCount,
}: {
  prefs: NotificationPrefs;
  whatsappAllowed: boolean;
  businessPhone: string;
  waConfig?: WaConfig;
  configuredTemplateCount: number;
}) {
  const t = useT();
  const router = useRouter();
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
  const [notifPhones, setNotifPhones] = useState<string[]>(prefs.notificationPhones);
  const [newPhone, setNewPhone] = useState("");

  function addPhone() {
    const cleaned = newPhone.replace(/[\s\-()]/g, "").trim();
    if (cleaned.length < 9) return;
    if (notifPhones.includes(cleaned)) return;
    setNotifPhones([...notifPhones, cleaned]);
    setNewPhone("");
    setSaved(false);
  }

  function removePhone(idx: number) {
    setNotifPhones(notifPhones.filter((_, i) => i !== idx));
    setSaved(false);
  }

  function handleSave() {
    setSaved(false);
    startTransition(async () => {
      await updateNotificationPreferences({
        whatsappEnabled,
        smsBookingEnabled,
        reminderHoursBefore: reminderHours,
        reminderHoursBefore2: reminderHours2 > 0 ? reminderHours2 : null,
        notificationPhones: notifPhones,
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
      });
      setTestResult(res.ok ? "sent" : "failed");
    } catch {
      setTestResult("failed");
    } finally {
      setTestPending(false);
    }
  }

  async function handleSyncMessages() {
    setSyncPending(true);
    setSyncResult(null);
    try {
      const result = await syncTwilioMessages();
      setSyncResult(`${result.synced}`);
      router.refresh();
    } catch {
      setSyncResult("0");
    } finally {
      setSyncPending(false);
    }
  }

  const waNumber = waConfig?.number;

  return (
    <div className="space-y-4">
      {/* WhatsApp Status Card */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 border-b bg-muted/30">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="size-4 text-green-600" />
            {t("msg.wa_status" as never)}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t("msg.wa_number" as never)}:</span>
              {waNumber ? (
                <span className="text-sm font-medium font-mono" dir="ltr">{waNumber}</span>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </div>
            <Badge className={waNumber
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 gap-1"
              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 gap-1"
            }>
              {waNumber ? (
                <><CheckCircle2 className="size-3" />{t("msg.wa_connected" as never)}</>
              ) : (
                <><AlertCircle className="size-3" />{t("msg.wa_not_configured" as never)}</>
              )}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t("msg.wa_templates_title" as never)}:</span>
            <span className="text-sm font-medium">{configuredTemplateCount} / 5</span>
          </div>
        </CardContent>
      </Card>

      {/* Channel Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="size-4 text-primary" />
            {t("settings.notif_title" as never)}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t("settings.notif_desc" as never)}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!whatsappAllowed && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
              <Lock className="size-4 shrink-0" />
              {t("settings.notif_upgrade" as never)}
            </div>
          )}

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
        </CardContent>
      </Card>

      {/* Reminders & Phones */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="size-4 text-primary" />
            {t("settings.notif_reminder_hours" as never)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Extra notification phones */}
          <div className="space-y-3">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">{t("msg.settings_extra_phones" as never)}</Label>
              <p className="text-xs text-muted-foreground">{t("msg.settings_extra_phones_desc" as never)}</p>
            </div>

            {notifPhones.length > 0 && (
              <div className="space-y-2">
                {notifPhones.map((phone, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="flex flex-1 items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
                      <Phone className="size-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-mono" dir="ltr">{phone}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                      onClick={() => removePhone(idx)}
                      disabled={pending}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Input
                type="tel"
                dir="ltr"
                placeholder="+972501234567"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addPhone(); } }}
                className="max-w-[220px] font-mono"
                disabled={pending}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={addPhone}
                disabled={pending || newPhone.replace(/[\s\-()]/g, "").trim().length < 9}
              >
                <Plus className="me-1 size-3" />
                {t("common.add")}
              </Button>
            </div>
          </div>
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
              className="max-w-[120px] h-9"
            />
          </div>

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
              className="max-w-[120px] h-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save */}
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

      {/* Actions: Test + Sync */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4 space-y-3">
            <div>
              <p className="text-sm font-medium">{t("msg.settings_test" as never)}</p>
              <p className="text-xs text-muted-foreground">{t("msg.wa_test_note" as never)}</p>
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
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="size-3" />{t("msg.settings_test_failed" as never)}
              </p>
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
