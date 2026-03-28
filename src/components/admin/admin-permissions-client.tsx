"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, UserPlus, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { demoteFromAdmin, promoteToAdmin } from "@/actions/admin";

export type AdminPermissionRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt: Date | string;
};

function formatDateAdded(d: Date | string) {
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" });
}

export function AdminPermissionsClient({
  admins,
  currentUserId,
}: {
  admins: AdminPermissionRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [formMessage, setFormMessage] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );
  const [rowError, setRowError] = useState<string | null>(null);
  const [pendingPromote, startPromote] = useTransition();
  const [pendingDemoteId, setPendingDemoteId] = useState<string | null>(null);

  function handlePromote() {
    setFormMessage(null);
    startPromote(async () => {
      const res = await promoteToAdmin(email);
      if (res.success) {
        setFormMessage({ type: "ok", text: "המשתמש הוגדר כאדמין בהצלחה." });
        setEmail("");
        router.refresh();
      } else {
        setFormMessage({ type: "err", text: res.error });
      }
    });
  }

  async function handleDemote(userId: string) {
    if (
      !confirm(
        "להסיר הרשאות אדמין ממשתמש זה? הוא לא יוכל עוד לגשת לפאנל הניהול."
      )
    ) {
      return;
    }
    setRowError(null);
    setPendingDemoteId(userId);
    const res = await demoteFromAdmin(userId);
    setPendingDemoteId(null);
    if (!res.success) {
      setRowError(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
          <ShieldCheck className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ניהול הרשאות אדמין</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            מנהלים עם הרשאת SUPER_ADMIN יכולים לגשת לפאנל הניהול ולבצע פעולות מערכת.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="size-4 text-slate-600" />
            הוסף אדמין
          </CardTitle>
          <CardDescription>
            הזן את כתובת האימייל של משתמש קיים במערכת כדי להעניק לו הרשאת SUPER_ADMIN.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1 space-y-2">
              <Input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={pendingPromote}
                dir="ltr"
                className="text-left"
              />
            </div>
            <Button
              type="button"
              className="gap-2"
              onClick={handlePromote}
              disabled={pendingPromote}
            >
              {pendingPromote ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  מוסיף…
                </>
              ) : (
                "הוסף"
              )}
            </Button>
          </div>
          {formMessage && (
            <p
              className={
                formMessage.type === "ok"
                  ? "text-sm font-medium text-emerald-700"
                  : "text-sm font-medium text-destructive"
              }
              role="alert"
            >
              {formMessage.text}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-base">אדמינים פעילים</CardTitle>
          <CardDescription>
            אדמין שמוסר לא יוכל לגשת יותר לפאנל הניהול.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {rowError && (
            <p className="mb-4 text-sm font-medium text-destructive" role="alert">
              {rowError}
            </p>
          )}
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-right">
                  <th className="px-4 py-3 font-medium text-muted-foreground">שם</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">אימייל</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">טלפון</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">תאריך הצטרפות</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {admins.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      אין אדמינים מוגדרים
                    </td>
                  </tr>
                ) : (
                  admins.map((a) => {
                    const isSelf = a.id === currentUserId;
                    const demoting = pendingDemoteId === a.id;
                    return (
                      <tr key={a.id} className="border-b last:border-0 hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-medium text-slate-900">{a.name}</td>
                        <td className="px-4 py-3 text-slate-700" dir="ltr">
                          {a.email ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-700" dir="ltr">
                          {a.phone ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                          {formatDateAdded(a.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="gap-1.5"
                            disabled={isSelf || demoting}
                            title={isSelf ? "לא ניתן להסיר את עצמך" : undefined}
                            onClick={() => handleDemote(a.id)}
                          >
                            {demoting ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <>
                                <Trash2 className="size-4" />
                                הסר הרשאות
                              </>
                            )}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
