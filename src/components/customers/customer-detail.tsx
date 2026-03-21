"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { addCustomerNote, updateCustomerTags, updateCustomerName } from "@/actions/customers";
import { assignCustomerPackage, cancelCustomerPackage, updateCustomerPackagePayment } from "@/actions/customer-packages";
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
  CreditCard,
  Loader2,
  Package,
} from "lucide-react";
import type { CustomerDetail, CustomerPackageRow } from "@/lib/db/queries/customers";
import type { InferSelectModel } from "drizzle-orm";
import type { servicePackages } from "@/lib/db/schema";

type ServicePackage = InferSelectModel<typeof servicePackages>;

interface Props {
  customer: CustomerDetail;
  businessId: string;
  customerPackages: CustomerPackageRow[];
  servicePackages: ServicePackage[];
}

export function CustomerDetailView({ customer, businessId, customerPackages: custPkgs, servicePackages: svcPkgs }: Props) {
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

      <CustomerPackagesSection
        customerId={customer.id}
        packages={custPkgs}
        servicePackages={svcPkgs}
        locale={locale}
        onRefresh={() => router.refresh()}
      />

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

const PKG_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  EXPIRED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  FULLY_USED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

function CustomerPackagesSection({
  customerId,
  packages,
  servicePackages: svcPkgs,
  locale,
  onRefresh,
}: {
  customerId: string;
  packages: CustomerPackageRow[];
  servicePackages: ServicePackage[];
  locale: "en" | "he";
  onRefresh: () => void;
}) {
  const t = useT();
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedPkgId, setSelectedPkgId] = useState("");
  const [payStatus, setPayStatus] = useState<"PAID" | "PENDING">("PAID");
  const [assigning, setAssigning] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const activePkgs = svcPkgs.filter((p) => p.isActive);

  async function handleAssign() {
    if (!selectedPkgId) return;
    setAssigning(true);
    await assignCustomerPackage(customerId, selectedPkgId, payStatus);
    setAssigning(false);
    setAssignOpen(false);
    setSelectedPkgId("");
    onRefresh();
  }

  async function handleCancel(id: string) {
    setCancellingId(id);
    await cancelCustomerPackage(id);
    setCancellingId(null);
    onRefresh();
  }

  async function handleTogglePayment(id: string, current: string) {
    const next = current === "PAID" ? "PENDING" : "PAID";
    await updateCustomerPackagePayment(id, next as "PAID" | "PENDING");
    onRefresh();
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="size-4" />
            {t("pkg.customer_title" as Parameters<typeof t>[0])}
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setAssignOpen(true)} className="h-7 text-xs">
            <Plus className="me-1 size-3" />
            {t("pkg.assign" as Parameters<typeof t>[0])}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {packages.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Package className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t("pkg.no_customer_packages_desc" as Parameters<typeof t>[0])}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {packages.map((cp) => {
              const total = cp.sessionsUsed + cp.sessionsRemaining;
              const pct = total > 0 ? (cp.sessionsUsed / total) * 100 : 0;
              const isActive = cp.status === "ACTIVE";

              return (
                <div
                  key={cp.id}
                  className={`rounded-lg border p-3 ${!isActive ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate">{cp.packageName}</p>
                        <span
                          className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                            PKG_STATUS_COLORS[cp.status] ?? ""
                          }`}
                        >
                          {t(`pkg.status_${cp.status.toLowerCase()}` as Parameters<typeof t>[0])}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {cp.serviceName}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {isActive && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleTogglePayment(cp.id, cp.paymentStatus)}
                            title={t("pkg.payment_status" as Parameters<typeof t>[0])}
                          >
                            <CreditCard
                              className={`size-3.5 ${
                                cp.paymentStatus === "PAID" ? "text-green-600" : "text-amber-500"
                              }`}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive"
                            onClick={() => handleCancel(cp.id)}
                            disabled={cancellingId === cp.id}
                          >
                            {cancellingId === cp.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <X className="size-3.5" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: pct >= 90 ? "#ef4444" : pct >= 60 ? "#f59e0b" : "#22c55e",
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium tabular-nums text-muted-foreground">
                      {cp.sessionsUsed}/{total}
                    </span>
                  </div>

                  {/* Meta */}
                  <div className="mt-1.5 flex flex-wrap gap-x-3 text-[11px] text-muted-foreground">
                    <span>
                      {t("pkg.sessions_remaining" as Parameters<typeof t>[0]).replace("{n}", String(cp.sessionsRemaining))}
                    </span>
                    {cp.paymentStatus === "PAID" ? (
                      <span className="text-green-600 font-medium">
                        {t("pkg.paid" as Parameters<typeof t>[0])}
                      </span>
                    ) : (
                      <span className="text-amber-600 font-medium">
                        {t("pkg.pending" as Parameters<typeof t>[0])}
                      </span>
                    )}
                    {cp.expiresAt && (
                      <span>
                        {t("pkg.expires_on" as Parameters<typeof t>[0]).replace(
                          "{date}",
                          new Date(cp.expiresAt).toLocaleDateString(
                            locale === "he" ? "he-IL" : "en-US",
                            { month: "short", day: "numeric", year: "numeric" }
                          )
                        )}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Assign dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("pkg.assign" as Parameters<typeof t>[0])}</DialogTitle>
            <DialogDescription>{t("pkg.assign_desc" as Parameters<typeof t>[0])}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("pkg.select_package" as Parameters<typeof t>[0])}</label>
              <select
                value={selectedPkgId}
                onChange={(e) => setSelectedPkgId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">—</option>
                {activePkgs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.sessionCount} {t("pkg.sessions" as Parameters<typeof t>[0])} · ₪{p.price}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("pkg.payment_status" as Parameters<typeof t>[0])}</label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={payStatus === "PAID" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPayStatus("PAID")}
                >
                  {t("pkg.paid" as Parameters<typeof t>[0])}
                </Button>
                <Button
                  type="button"
                  variant={payStatus === "PENDING" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPayStatus("PENDING")}
                >
                  {t("pkg.pending" as Parameters<typeof t>[0])}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)} disabled={assigning}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleAssign} disabled={assigning || !selectedPkgId}>
              {assigning && <Loader2 className="me-2 size-4 animate-spin" />}
              {t("pkg.assign" as Parameters<typeof t>[0])}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
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
