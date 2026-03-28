"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, Loader2, Trash2, Power, PowerOff, Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  createAnnouncement,
  deleteAnnouncement,
  toggleAnnouncement,
} from "@/actions/admin";

/** Row shape from `getAnnouncements` (dates may serialize as strings over RSC). */
export type AdminAnnouncementRow = {
  id: string;
  title: string;
  body: string;
  type: string;
  targetPlan: string | null;
  isActive: boolean;
  createdBy: string | null;
  createdAt: Date | string;
  expiresAt: Date | string | null;
};

const TYPE_LABELS: Record<string, string> = {
  info: "מידע",
  warning: "אזהרה",
  update: "עדכון",
};

const TYPE_BADGE: Record<string, string> = {
  info: "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-100",
  warning: "border-transparent bg-amber-100 text-amber-900 hover:bg-amber-100",
  update: "border-transparent bg-violet-100 text-violet-800 hover:bg-violet-100",
};

const ALL_PLANS_VALUE = "ALL";

const PLAN_LABELS: Record<string, string> = {
  [ALL_PLANS_VALUE]: "כולם",
  FREE: "FREE",
  STARTER: "STARTER",
  PRO: "PRO",
};

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" });
}

function bodyPreview(body: string, max = 160) {
  const t = body.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export function AdminAnnouncementsClient({
  announcements: initial,
}: {
  announcements: AdminAnnouncementRow[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("info");
  const [targetPlan, setTargetPlan] = useState(ALL_PLANS_VALUE);
  const [expiresAt, setExpiresAt] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setTitle("");
    setBody("");
    setType("info");
    setTargetPlan(ALL_PLANS_VALUE);
    setExpiresAt("");
    setFormError(null);
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    startTransition(async () => {
      const res = await createAnnouncement({
        title: title.trim(),
        body: body.trim(),
        type,
        targetPlan: targetPlan === ALL_PLANS_VALUE ? null : targetPlan,
        expiresAt: expiresAt.trim() === "" ? null : expiresAt,
      });
      if (!res.success) {
        setFormError(res.error);
        return;
      }
      resetForm();
      setShowForm(false);
      router.refresh();
    });
  }

  function handleToggle(id: string, nextActive: boolean) {
    setPendingId(id);
    startTransition(async () => {
      const res = await toggleAnnouncement(id, nextActive);
      setPendingId(null);
      if (!res.success) {
        setFormError(res.error);
        return;
      }
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    if (!confirm("האם למחוק את ההודעה? פעולה זו אינה הפיכה.")) return;
    setPendingId(id);
    startTransition(async () => {
      const res = await deleteAnnouncement(id);
      setPendingId(null);
      if (!res.success) {
        setFormError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-8" dir="rtl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-slate-900 p-2.5">
            <Megaphone className="size-6 text-white" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">הודעות מערכת</h1>
            <p className="text-sm text-muted-foreground">
              ניהול הודעות שמוצגות למשתמשים בלוח הבקרה
            </p>
          </div>
        </div>
        <Button
          type="button"
          onClick={() => {
            setShowForm((v) => !v);
            setFormError(null);
          }}
          className="shrink-0 gap-2"
        >
          {showForm ? (
            <>
              <X className="size-4" />
              סגור טופס
            </>
          ) : (
            <>
              <Plus className="size-4" />
              הודעה חדשה
            </>
          )}
        </Button>
      </div>

      {formError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {formError}
        </p>
      )}

      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">יצירת הודעה</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ann-title">כותרת</Label>
                <Input
                  id="ann-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  dir="rtl"
                  className="text-right"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ann-body">תוכן</Label>
                <Textarea
                  id="ann-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                  rows={5}
                  dir="rtl"
                  className="text-right"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>סוג</Label>
                  <Select value={type} onValueChange={(v) => setType(v ?? "info")}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">{TYPE_LABELS.info}</SelectItem>
                      <SelectItem value="warning">{TYPE_LABELS.warning}</SelectItem>
                      <SelectItem value="update">{TYPE_LABELS.update}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>תוכנית יעד</Label>
                  <Select
                    value={targetPlan}
                    onValueChange={(v) => setTargetPlan(v ?? ALL_PLANS_VALUE)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_PLANS_VALUE}>{PLAN_LABELS[ALL_PLANS_VALUE]}</SelectItem>
                      <SelectItem value="FREE">FREE</SelectItem>
                      <SelectItem value="STARTER">STARTER</SelectItem>
                      <SelectItem value="PRO">PRO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ann-expires">תאריך תפוגה (אופציונלי)</Label>
                <Input
                  id="ann-expires"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="max-w-md"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={isPending} className="gap-2">
                  {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                  פרסם הודעה
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                >
                  ביטול
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {initial.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              אין הודעות עדיין. לחץ על &quot;הודעה חדשה&quot; כדי ליצור את הראשונה.
            </CardContent>
          </Card>
        ) : (
          initial.map((row) => {
            const typeKey = row.type in TYPE_BADGE ? row.type : "info";
            const busy = pendingId === row.id && isPending;
            return (
              <Card key={row.id}>
                <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 pb-2">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-lg leading-tight">{row.title}</CardTitle>
                      <Badge className={TYPE_BADGE[typeKey] ?? TYPE_BADGE.info}>
                        {TYPE_LABELS[typeKey] ?? row.type}
                      </Badge>
                      <Badge variant="outline">
                        {row.targetPlan == null || row.targetPlan === ""
                          ? PLAN_LABELS[ALL_PLANS_VALUE]
                          : PLAN_LABELS[row.targetPlan] ?? row.targetPlan}
                      </Badge>
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span
                          className={`size-2 shrink-0 rounded-full ${
                            row.isActive ? "bg-emerald-500" : "bg-slate-300"
                          }`}
                          aria-hidden
                        />
                        {row.isActive ? "פעיל" : "לא פעיל"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      נוצר: {formatDate(row.createdAt)}
                      {row.expiresAt ? (
                        <>
                          {" "}
                          · פג תוקף: {formatDate(row.expiresAt)}
                        </>
                      ) : null}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      disabled={busy}
                      onClick={() => handleToggle(row.id, !row.isActive)}
                    >
                      {busy ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : row.isActive ? (
                        <PowerOff className="size-3.5" />
                      ) : (
                        <Power className="size-3.5" />
                      )}
                      {row.isActive ? "השבת" : "הפעל"}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="gap-1.5"
                      disabled={busy}
                      onClick={() => handleDelete(row.id)}
                    >
                      <Trash2 className="size-3.5" />
                      מחק
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm text-slate-700">
                    {bodyPreview(row.body)}
                  </p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
