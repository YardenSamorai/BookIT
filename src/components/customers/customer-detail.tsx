"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { addCustomerNote, updateCustomerTags, updateCustomerName } from "@/actions/customers";
import {
  Calendar,
  XCircle,
  AlertTriangle,
  Phone,
  Mail,
  Clock,
  Plus,
  X,
  Send,
  StickyNote,
  Pencil,
  Check,
} from "lucide-react";
import type { CustomerDetail } from "@/lib/db/queries/customers";

interface Props {
  customer: CustomerDetail;
  businessId: string;
}

export function CustomerDetailView({ customer, businessId }: Props) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();

  return (
    <div className="space-y-6">
      <HeaderCard customer={customer} locale={locale} onRefresh={() => router.refresh()} />

      <div className="grid gap-6 lg:grid-cols-3">
        <StatCard
          icon={<Calendar className="size-5 text-primary" />}
          label={t("cust.appointments")}
          value={customer.appointmentCount}
        />
        <StatCard
          icon={<XCircle className="size-5 text-orange-500" />}
          label={t("cust.cancellations")}
          value={customer.cancellationCount}
        />
        <StatCard
          icon={<AlertTriangle className="size-5 text-red-500" />}
          label={t("cust.no_shows")}
          value={customer.noShowCount}
        />
      </div>

      <TagsSection
        customerId={customer.id}
        tags={customer.tags}
        onRefresh={() => router.refresh()}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <NotesSection
          customerId={customer.id}
          businessId={businessId}
          notes={customer.notes}
          locale={locale}
          onRefresh={() => router.refresh()}
        />
        <AppointmentHistory
          appointments={customer.appointments}
          locale={locale}
        />
      </div>
    </div>
  );
}

function HeaderCard({
  customer,
  locale,
  onRefresh,
}: {
  customer: CustomerDetail;
  locale: "en" | "he";
  onRefresh: () => void;
}) {
  const t = useT();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(customer.name);
  const [pending, startTransition] = useTransition();

  const joinDate = new Date(customer.createdAt).toLocaleDateString(
    locale === "he" ? "he-IL" : "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  function handleSave() {
    if (!name.trim() || name.trim() === customer.name) {
      setName(customer.name);
      setEditing(false);
      return;
    }
    startTransition(async () => {
      const res = await updateCustomerName(customer.id, name.trim());
      if (res.success) {
        setEditing(false);
        onRefresh();
      }
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <span className="text-2xl font-bold">
            {customer.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          {editing ? (
            <form
              onSubmit={(e) => { e.preventDefault(); handleSave(); }}
              className="flex items-center gap-2"
            >
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 max-w-xs text-lg font-semibold"
                autoFocus
                disabled={pending}
              />
              <Button type="submit" size="sm" variant="ghost" disabled={pending || !name.trim()}>
                <Check className="size-4 text-green-600" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => { setName(customer.name); setEditing(false); }}
                disabled={pending}
              >
                <X className="size-4" />
              </Button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">{customer.name}</h2>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setEditing(true)}
              >
                <Pencil className="size-3.5 text-muted-foreground" />
              </Button>
            </div>
          )}
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
            {customer.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="size-3.5" />
                <span dir="ltr">{customer.phone}</span>
              </span>
            )}
            {customer.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="size-3.5" />
                {customer.email}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5" />
              {t("cust.joined")} {joinDate}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function TagsSection({
  customerId,
  tags: initialTags,
  onRefresh,
}: {
  customerId: string;
  tags: string[];
  onRefresh: () => void;
}) {
  const t = useT();
  const [tags, setTags] = useState(initialTags);
  const [newTag, setNewTag] = useState("");
  const [pending, startTransition] = useTransition();

  function saveTags(next: string[]) {
    setTags(next);
    startTransition(async () => {
      await updateCustomerTags(customerId, next);
      onRefresh();
    });
  }

  function handleAdd() {
    const val = newTag.trim();
    if (!val || tags.includes(val)) return;
    setNewTag("");
    saveTags([...tags, val]);
  }

  function handleRemove(tag: string) {
    saveTags(tags.filter((t) => t !== tag));
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t("cust.tags")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 pe-1.5">
              {tag}
              <button
                type="button"
                onClick={() => handleRemove(tag)}
                className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                disabled={pending}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAdd();
          }}
          className="flex gap-2"
        >
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder={t("cust.add_tag_ph")}
            className="max-w-xs"
            disabled={pending}
          />
          <Button type="submit" size="sm" variant="outline" disabled={pending || !newTag.trim()}>
            <Plus className="size-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function NotesSection({
  customerId,
  businessId,
  notes,
  locale,
  onRefresh,
}: {
  customerId: string;
  businessId: string;
  notes: CustomerDetail["notes"];
  locale: "en" | "he";
  onRefresh: () => void;
}) {
  const t = useT();
  const [content, setContent] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    if (!content.trim()) return;
    startTransition(async () => {
      const result = await addCustomerNote(customerId, businessId, content);
      if (result.success) {
        setContent("");
        onRefresh();
      }
    });
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t("cust.notes")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-2"
        >
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("cust.note_ph")}
            rows={3}
            disabled={pending}
          />
          <Button
            type="submit"
            size="sm"
            disabled={pending || !content.trim()}
            className="gap-1.5"
          >
            <Send className="size-3.5" />
            {t("cust.add_note")}
          </Button>
        </form>

        <Separator />

        {notes.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
            <StickyNote className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t("cust.no_notes")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="rounded-lg border p-3">
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium">{note.authorName}</span>
                  <time>
                    {new Date(note.createdAt).toLocaleDateString(
                      locale === "he" ? "he-IL" : "en-US",
                      { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                    )}
                  </time>
                </div>
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  CONFIRMED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  NO_SHOW: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
};

function AppointmentHistory({
  appointments,
  locale,
}: {
  appointments: CustomerDetail["appointments"];
  locale: "en" | "he";
}) {
  const t = useT();

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t("cust.appointment_history")}</CardTitle>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <Calendar className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t("cust.no_customers_desc")}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="truncate text-sm font-medium">{apt.serviceName}</p>
                  <p className="text-xs text-muted-foreground">{apt.staffName}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[apt.status] ?? ""}`}
                  >
                    {t(`dash.status_${apt.status.toLowerCase()}` as Parameters<typeof t>[0])}
                  </span>
                  <time className="text-xs text-muted-foreground">
                    {new Date(apt.startTime).toLocaleDateString(
                      locale === "he" ? "he-IL" : "en-US",
                      { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                    )}
                  </time>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
