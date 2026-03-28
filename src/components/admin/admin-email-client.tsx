"use client";

import { useState, useTransition } from "react";
import { Mail, Send, Users, Filter, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getBusinessOwnerEmails,
  sendBulkEmail,
  type BusinessOwnerEmailRow,
} from "@/actions/admin";

const ALL = "ALL";

const PLAN_OPTIONS = [
  { value: ALL, label: "כל התוכניות" },
  { value: "FREE", label: "FREE" },
  { value: "STARTER", label: "STARTER" },
  { value: "PRO", label: "PRO" },
] as const;

const STATUS_OPTIONS = [
  { value: ALL, label: "כל הסטטוסים" },
  { value: "ACTIVE", label: "ACTIVE" },
  { value: "CANCELLED", label: "CANCELLED" },
  { value: "PAST_DUE", label: "PAST_DUE" },
] as const;

export function AdminEmailClient() {
  const [planFilter, setPlanFilter] = useState<string>(ALL);
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [recipients, setRecipients] = useState<BusinessOwnerEmailRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadError, setLoadError] = useState<string | null>(null);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const [sendResult, setSendResult] = useState<{
    sent: number;
    failed: number;
    total: number;
  } | null>(null);

  const [isLoadingList, startLoadList] = useTransition();
  const [isSending, startSend] = useTransition();

  function loadRecipients() {
    setLoadError(null);
    setSendResult(null);
    startLoadList(async () => {
      try {
        const rows = await getBusinessOwnerEmails({
          plan:
            planFilter === ALL
              ? undefined
              : (planFilter as "FREE" | "STARTER" | "PRO"),
          status:
            statusFilter === ALL
              ? undefined
              : (statusFilter as "ACTIVE" | "CANCELLED" | "PAST_DUE"),
        });
        setRecipients(rows);
        setSelectedIds(new Set(rows.map((r) => r.id)));
      } catch {
        setLoadError("טעינת הנמענים נכשלה");
        setRecipients([]);
        setSelectedIds(new Set());
      }
    });
  }

  function toggleId(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(recipients.map((r) => r.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  const selectedRows = recipients.filter((r) => selectedIds.has(r.id));
  const selectedEmails = selectedRows.map((r) => r.email);

  function handleSend() {
    const trimmedSubject = subject.trim();
    const trimmedBody = body.trim();
    if (!trimmedSubject || !trimmedBody) {
      return;
    }
    if (selectedEmails.length === 0) {
      return;
    }
    const ok = window.confirm(
      `לשלוח ${selectedEmails.length} אימיילים? פעולה זו לא ניתנת לביטול.`
    );
    if (!ok) return;

    setSendResult(null);
    startSend(async () => {
      const res = await sendBulkEmail({
        subject: trimmedSubject,
        body: trimmedBody,
        recipientEmails: selectedEmails,
      });
      setSendResult({
        sent: res.sent,
        failed: res.failed,
        total: selectedEmails.length,
      });
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6" dir="rtl">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-slate-900 text-white">
          <Mail className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">שליחת אימייל המונית</h1>
          <p className="text-sm text-muted-foreground">
            שליחה לבעלי עסקים לפי מסננים
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="size-5" />
            שלב 1: סינון נמענים
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>תוכנית</Label>
              <Select
                value={planFilter}
                onValueChange={(v) => setPlanFilter(v ?? ALL)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="תוכנית" />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>סטטוס מנוי</Label>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v ?? ALL)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="סטטוס" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="button" onClick={loadRecipients} disabled={isLoadingList}>
            {isLoadingList ? (
              <>
                <Loader2 className="ms-2 size-4 animate-spin" />
                טוען…
              </>
            ) : (
              "טען נמענים"
            )}
          </Button>

          {loadError && (
            <p className="text-sm text-destructive" role="alert">
              {loadError}
            </p>
          )}

          {recipients.length > 0 && (
            <div className="space-y-3 border-t pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <Users className="size-4" />
                  נמצאו {recipients.length} נמענים
                </p>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={selectAll}>
                    בחר הכל
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={clearSelection}>
                    בטל בחירה
                  </Button>
                </div>
              </div>

              <ul className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-3">
                {recipients.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-start gap-3 rounded-md px-1 py-1.5 hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      id={`rec-${r.id}`}
                      checked={selectedIds.has(r.id)}
                      onChange={() => toggleId(r.id)}
                      className="mt-1 size-4 rounded border-input"
                    />
                    <label htmlFor={`rec-${r.id}`} className="min-w-0 flex-1 cursor-pointer">
                      <span className="font-medium">{r.name}</span>
                      <span className="block truncate text-sm text-muted-foreground">
                        {r.email}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {r.plan} · {r.status}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="size-5" />
            שלב 2: כתיבת ההודעה
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bulk-subject">נושא</Label>
            <Input
              id="bulk-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="נושא האימייל"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bulk-body">תוכן</Label>
            <Textarea
              id="bulk-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="גוף ההודעה (שורות חדשות יוצגו כשבירת שורה)"
              className="min-h-[200px] resize-y"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            נבחרו {selectedRows.length} נמענים לשליחה
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Send className="size-5" />
            שלב 3: שליחה
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            type="button"
            onClick={handleSend}
            disabled={
              isSending ||
              selectedRows.length === 0 ||
              !subject.trim() ||
              !body.trim()
            }
            className="gap-2"
          >
            {isSending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                שולח…
              </>
            ) : (
              <>
                <Send className="size-4" />
                שלח {selectedRows.length} אימיילים
              </>
            )}
          </Button>

          {sendResult && (
            <div
              className="rounded-md border border-border bg-muted/40 p-4 text-sm"
              role="status"
            >
              <p className="font-medium">
                נשלחו {sendResult.sent} מתוך {sendResult.total}
              </p>
              {sendResult.failed > 0 && (
                <p className="mt-1 text-destructive">
                  נכשלו {sendResult.failed} שליחות
                </p>
              )}
              {sendResult.failed === 0 && sendResult.sent === sendResult.total && (
                <p className="mt-1 text-green-700 dark:text-green-400">כל האימיילים נשלחו בהצלחה</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
