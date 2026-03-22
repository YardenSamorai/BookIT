"use client";

import { useState, useMemo, useRef, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { telLink, whatsappLink } from "@/lib/utils/phone";
import { importCustomers, deleteCustomer, addCustomer, archiveCustomer } from "@/actions/customers";
import { BookingCalendarSheet } from "@/components/customers/booking-calendar-sheet";
import type { CustomerRow } from "@/lib/db/queries/customers";
import {
  Users,
  Search,
  Download,
  Upload,
  Eye,
  CalendarPlus,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  UserPlus,
  Loader2,
  SlidersHorizontal,
  Phone,
  MessageCircle,
  CreditCard,
  DollarSign,
  AlertTriangle,
  MoreHorizontal,
  StickyNote,
  CheckSquare,
  Square,
  X,
  TrendingUp,
  UserCheck,
  Sparkles,
  Clock,
  Archive,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CustomerListProps {
  customers: CustomerRow[];
  businessId: string;
  staff: { id: string; name: string }[];
  services: { id: string; title: string; durationMinutes: number; isGroup?: boolean }[];
  serviceStaffLinks?: { serviceId: string; staffId: string }[];
}

type SortKey = "name" | "createdAt" | "lastVisitDate" | "nextAppointmentDate" | "unpaidBalance";
type SortDir = "asc" | "desc";
type SmartView = "all" | "active" | "new" | "with_cards" | "pending_payment" | "needs_attention" | "archived";

interface Filters {
  statuses: string[];
  hasActiveCards: boolean;
  hasPendingCards: boolean;
  hasUnpaid: boolean;
  noShowRisk: boolean;
  source: string;
}

const EMPTY_FILTERS: Filters = {
  statuses: [],
  hasActiveCards: false,
  hasPendingCards: false,
  hasUnpaid: false,
  noShowRisk: false,
  source: "",
};

const STATUS_BADGE: Record<string, string> = {
  LEAD: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  INACTIVE: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  BLOCKED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  ARCHIVED: "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500",
};

// ─── Main Component ──────────────────────────────────────────────────────────

export function CustomerList({ customers, businessId, staff, services, serviceStaffLinks }: CustomerListProps) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [activeView, setActiveView] = useState<SmartView>("all");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [bookingCustomer, setBookingCustomer] = useState<{ name: string; phone: string } | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const dateLocale = locale === "he" ? "he-IL" : "en-US";

  const hasActiveFilters = filters.statuses.length > 0 || filters.hasActiveCards || filters.hasPendingCards || filters.hasUnpaid || filters.noShowRisk || filters.source !== "";

  // ── KPI Computation ──
  const kpis = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nonArchived = customers.filter((c) => c.status !== "ARCHIVED");
    return {
      total: nonArchived.length,
      active: customers.filter((c) => c.status === "ACTIVE").length,
      newMonth: nonArchived.filter((c) => new Date(c.createdAt) >= monthStart).length,
      withCards: nonArchived.filter((c) => c.activeCards > 0).length,
      unpaid: nonArchived.filter((c) => parseFloat(c.unpaidBalance) > 0).length,
      attention: nonArchived.filter(
        (c) => c.noShowCount >= 3 || parseFloat(c.unpaidBalance) > 0 || c.pendingCards > 0 || c.status === "BLOCKED"
      ).length,
    };
  }, [customers]);

  // ── Sources (for filter) ──
  const allSources = useMemo(() => {
    const set = new Set<string>();
    customers.forEach((c) => { if (c.source) set.add(c.source); });
    return Array.from(set).sort();
  }, [customers]);

  // ── Smart View filtering ──
  const viewFiltered = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    switch (activeView) {
      case "all":
        return customers.filter((c) => c.status !== "ARCHIVED");
      case "active":
        return customers.filter((c) => c.status === "ACTIVE");
      case "new":
        return customers.filter((c) => c.status !== "ARCHIVED" && new Date(c.createdAt) >= monthStart);
      case "with_cards":
        return customers.filter((c) => c.status !== "ARCHIVED" && c.activeCards > 0);
      case "pending_payment":
        return customers.filter((c) => c.status !== "ARCHIVED" && (c.pendingCards > 0 || parseFloat(c.unpaidBalance) > 0));
      case "needs_attention":
        return customers.filter(
          (c) => c.status !== "ARCHIVED" && (c.noShowCount >= 3 || parseFloat(c.unpaidBalance) > 0 || c.pendingCards > 0 || c.status === "BLOCKED")
        );
      case "archived":
        return customers.filter((c) => c.status === "ARCHIVED");
      default:
        return customers;
    }
  }, [customers, activeView]);

  // ── Advanced filters ──
  const advFiltered = useMemo(() => {
    let list = viewFiltered;
    if (filters.statuses.length > 0) {
      list = list.filter((c) => filters.statuses.includes(c.status));
    }
    if (filters.hasActiveCards) list = list.filter((c) => c.activeCards > 0);
    if (filters.hasPendingCards) list = list.filter((c) => c.pendingCards > 0);
    if (filters.hasUnpaid) list = list.filter((c) => parseFloat(c.unpaidBalance) > 0);
    if (filters.noShowRisk) list = list.filter((c) => c.noShowCount >= 3);
    if (filters.source) list = list.filter((c) => c.source === filters.source);
    return list;
  }, [viewFiltered, filters]);

  // ── Search + Sort ──
  const sorted = useMemo(() => {
    let list = advFiltered;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.tags?.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    return [...list].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "name":
          return dir * a.name.localeCompare(b.name, locale);
        case "createdAt":
          return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        case "lastVisitDate": {
          const da = a.lastVisitDate ? new Date(a.lastVisitDate).getTime() : 0;
          const db = b.lastVisitDate ? new Date(b.lastVisitDate).getTime() : 0;
          return dir * (da - db);
        }
        case "nextAppointmentDate": {
          const da = a.nextAppointmentDate ? new Date(a.nextAppointmentDate).getTime() : Infinity;
          const db = b.nextAppointmentDate ? new Date(b.nextAppointmentDate).getTime() : Infinity;
          return dir * (da - db);
        }
        case "unpaidBalance":
          return dir * ((parseFloat(a.unpaidBalance) || 0) - (parseFloat(b.unpaidBalance) || 0));
        default:
          return 0;
      }
    });
  }, [advFiltered, search, sortKey, sortDir, locale]);

  // ── Helpers ──
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === sorted.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(sorted.map((c) => c.id)));
  }, [sorted, selectedIds.size]);

  function fmtDate(d: string | Date) {
    return new Date(d).toLocaleDateString(dateLocale, { day: "numeric", month: "short", year: "numeric" });
  }

  function fmtShortDate(d: string | Date) {
    return new Date(d).toLocaleDateString(dateLocale, { day: "numeric", month: "short" });
  }

  function getRelativeDate(d: string | Date): string {
    const now = new Date();
    const date = new Date(d);
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return t("cust.today");
    if (diffDays < 60) return t("cust.days_ago", { n: diffDays });
    return fmtShortDate(d);
  }

  function needsAttention(c: CustomerRow): boolean {
    return c.noShowCount >= 3 || parseFloat(c.unpaidBalance) > 0 || c.pendingCards > 0 || c.status === "BLOCKED" || !c.phone;
  }

  // ── Actions ──
  async function handleExport() {
    const { utils, writeFile } = await import("xlsx");
    const list = selectedIds.size > 0 ? sorted.filter((c) => selectedIds.has(c.id)) : sorted;
    const data = list.map((c) => ({
      [t("cust.col_name")]: c.name,
      [t("cust.phone")]: c.phone ?? "",
      [t("cust.email")]: c.email ?? "",
      [t("cust.col_status")]: c.status,
      [t("cust.col_created")]: fmtDate(c.createdAt),
      [t("cust.col_last_visit")]: c.lastVisitDate ? fmtDate(c.lastVisitDate) : "",
      [t("cust.active_cards")]: c.activeCards,
      [t("cust.unpaid_balance")]: parseFloat(c.unpaidBalance) || 0,
      [t("cust.appointments")]: c.appointmentCount,
    }));
    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, t("cust.title"));
    writeFile(wb, `customers-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const { read, utils } = await import("xlsx");
    const buf = await file.arrayBuffer();
    const wb = read(buf);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = utils.sheet_to_json<Record<string, string>>(ws);
    const mapped = rows.map((r) => {
      const name = r["name"] || r["Name"] || r["שם"] || r["שם מלא"] || r["שם לקוח"] || "";
      const phone = r["phone"] || r["Phone"] || r["טלפון"] || r["מספר טלפון"] || r["נייד"] || "";
      const email = r["email"] || r["Email"] || r["אימייל"] || r["מייל"] || "";
      return { name, phone, email: email || undefined };
    });
    const valid = mapped.filter((r) => r.name && r.phone);
    if (valid.length === 0) { alert(t("cust.import_no_valid")); return; }
    startTransition(async () => {
      const result = await importCustomers(valid);
      if (result.success) {
        alert(t("cust.import_done").replace("{imported}", String(result.data.imported)).replace("{skipped}", String(result.data.skipped)));
        router.refresh();
      }
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleBulkArchive() {
    if (selectedIds.size === 0) return;
    startTransition(async () => {
      for (const id of selectedIds) {
        await archiveCustomer(id);
      }
      setSelectedIds(new Set());
      router.refresh();
    });
  }

  // ── Smart view tabs data ──
  const views: { key: SmartView; label: string; count?: number }[] = [
    { key: "all", label: t("cust.view_all_customers"), count: kpis.total },
    { key: "active", label: t("cust.view_active"), count: kpis.active },
    { key: "new", label: t("cust.view_new"), count: kpis.newMonth },
    { key: "with_cards", label: t("cust.view_with_cards"), count: kpis.withCards },
    { key: "pending_payment", label: t("cust.view_pending_payment") },
    { key: "needs_attention", label: t("cust.view_needs_attention"), count: kpis.attention },
    { key: "archived", label: t("cust.view_archived") },
  ];

  // ── Empty state ──
  if (customers.length === 0) {
    return (
      <>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="rounded-full bg-muted p-4">
              <Users className="size-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-lg">{t("cust.no_customers")}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("cust.no_customers_desc")}</p>
            </div>
            <Button onClick={() => setAddDialogOpen(true)} className="mt-2">
              <UserPlus className="size-4 me-1.5" />
              {t("cust.add_customer")}
            </Button>
          </CardContent>
        </Card>
        <AddCustomerDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      </>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── KPI Summary Row ── */}
      <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        <KpiCard icon={<Users className="size-4 text-slate-500" />} label={t("cust.kpi_total")} value={kpis.total} />
        <KpiCard icon={<UserCheck className="size-4 text-green-500" />} label={t("cust.kpi_active")} value={kpis.active} />
        <KpiCard icon={<Sparkles className="size-4 text-blue-500" />} label={t("cust.kpi_new_month")} value={kpis.newMonth} />
        <KpiCard icon={<CreditCard className="size-4 text-purple-500" />} label={t("cust.kpi_with_cards")} value={kpis.withCards} />
        <KpiCard icon={<DollarSign className="size-4 text-red-500" />} label={t("cust.kpi_unpaid")} value={kpis.unpaid} alert={kpis.unpaid > 0} />
        <KpiCard icon={<AlertTriangle className="size-4 text-amber-500" />} label={t("cust.kpi_attention")} value={kpis.attention} alert={kpis.attention > 0} />
      </div>

      {/* ── Header: Search + Actions ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("cust.search_ph")}
            className="ps-9 h-10"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" onClick={() => setAddDialogOpen(true)}>
            <UserPlus className="size-4 me-1.5" />
            <span className="hidden sm:inline">{t("cust.add_customer")}</span>
            <span className="sm:hidden">{t("common.add")}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="size-4 sm:me-1.5" />
            <span className="hidden sm:inline">{t("cust.export_excel")}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isPending}>
            <Upload className="size-4 sm:me-1.5" />
            <span className="hidden sm:inline">{t("cust.import_excel")}</span>
          </Button>
          <Button
            variant={hasActiveFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterSheetOpen(true)}
          >
            <SlidersHorizontal className="size-4 sm:me-1.5" />
            <span className="hidden sm:inline">{t("cust.filters")}</span>
          </Button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
        </div>
      </div>

      {/* ── Smart View Tabs ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        {views.map((v) => (
          <button
            key={v.key}
            type="button"
            onClick={() => { setActiveView(v.key); setSelectedIds(new Set()); }}
            className={`
              shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors
              ${activeView === v.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              }
            `}
          >
            {v.label}
            {v.count !== undefined && v.count > 0 && (
              <span className={`text-xs tabular-nums ${activeView === v.key ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {v.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Bulk Actions Bar ── */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-2">
          <span className="text-sm font-medium">
            {t("cust.selected", { n: selectedIds.size })}
          </span>
          <Separator orientation="vertical" className="h-5" />
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleBulkArchive} disabled={isPending}>
            <Archive className="size-3 me-1" />
            {t("cust.bulk_archive")}
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleExport}>
            <Download className="size-3 me-1" />
            {t("cust.bulk_export")}
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs ms-auto" onClick={() => setSelectedIds(new Set())}>
            <X className="size-3" />
          </Button>
        </div>
      )}

      {/* ── Results count ── */}
      <p className="text-xs text-muted-foreground">
        {sorted.length} / {customers.length} {t("cust.title")}
      </p>

      {/* ── No results ── */}
      {sorted.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="rounded-full bg-muted p-3">
              <Search className="size-6 text-muted-foreground" />
            </div>
            <p className="font-medium">{t("cust.no_results")}</p>
            <p className="text-sm text-muted-foreground">{t("cust.no_results_desc")}</p>
            {(search || hasActiveFilters) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setSearch(""); setFilters(EMPTY_FILTERS); }}
              >
                {t("cust.clear_filters")}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── Desktop Table ── */}
          <div className="hidden md:block overflow-x-auto rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-muted-foreground">
                  <th className="w-10 px-3 py-3">
                    <button type="button" onClick={toggleSelectAll} className="flex items-center justify-center">
                      {selectedIds.size === sorted.length && sorted.length > 0
                        ? <CheckSquare className="size-4 text-primary" />
                        : <Square className="size-4" />}
                    </button>
                  </th>
                  <SortTh col="name" label={t("cust.col_customer")} sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <th className="whitespace-nowrap px-4 py-3 text-start font-medium">{t("cust.col_status")}</th>
                  <th className="whitespace-nowrap px-4 py-3 text-start font-medium">{t("cust.col_contact")}</th>
                  <SortTh col="lastVisitDate" label={t("cust.col_last_visit")} sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <SortTh col="nextAppointmentDate" label={t("cust.col_next_apt")} sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <th className="whitespace-nowrap px-4 py-3 text-start font-medium">{t("cust.col_cards")}</th>
                  <SortTh col="unpaidBalance" label={t("cust.col_financial")} sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <th className="whitespace-nowrap px-4 py-3 text-start font-medium">{t("cust.col_tags")}</th>
                  <th className="whitespace-nowrap px-4 py-3 text-start font-medium">{t("cust.col_actions")}</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((c) => {
                  const unpaid = parseFloat(c.unpaidBalance) || 0;
                  const isSelected = selectedIds.has(c.id);
                  return (
                    <tr
                      key={c.id}
                      className={`border-b last:border-0 transition-colors hover:bg-muted/30 ${isSelected ? "bg-primary/5" : ""}`}
                    >
                      {/* Checkbox */}
                      <td className="w-10 px-3 py-3">
                        <button type="button" onClick={() => toggleSelect(c.id)} className="flex items-center justify-center">
                          {isSelected
                            ? <CheckSquare className="size-4 text-primary" />
                            : <Square className="size-4 text-muted-foreground" />}
                        </button>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="text-start hover:underline"
                          onClick={() => router.push(`/dashboard/customers/${c.id}`)}
                        >
                          <div className="flex items-center gap-3">
                            <CustomerAvatar name={c.name} attention={needsAttention(c)} />
                            <div className="min-w-0">
                              <p className="font-medium truncate max-w-[200px]">{c.name}</p>
                              <p className="text-xs text-muted-foreground truncate" dir="ltr">
                                {c.email ?? ""}
                              </p>
                            </div>
                          </div>
                        </button>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[c.status] ?? ""}`}>
                          {t(`cust.status_${c.status.toLowerCase()}` as Parameters<typeof t>[0])}
                        </span>
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3">
                        {c.phone ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground tabular-nums" dir="ltr">{c.phone}</span>
                            <a href={telLink(c.phone)} className="text-muted-foreground hover:text-foreground"><Phone className="size-3" /></a>
                            <a href={whatsappLink(c.phone)} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-green-600"><MessageCircle className="size-3" /></a>
                          </div>
                        ) : (
                          <span className="text-xs text-amber-600 font-medium">{t("cust.no_phone")}</span>
                        )}
                      </td>

                      {/* Last Visit */}
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground text-xs">
                        {c.lastVisitDate ? getRelativeDate(c.lastVisitDate) : <span className="text-muted-foreground/50">—</span>}
                      </td>

                      {/* Next Appointment */}
                      <td className="whitespace-nowrap px-4 py-3 text-xs">
                        {c.nextAppointmentDate ? (
                          <span className="text-blue-600 font-medium">{fmtShortDate(c.nextAppointmentDate)}</span>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </td>

                      {/* Cards */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {c.activeCards > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                              <CreditCard className="size-2.5" />
                              {c.activeCards}
                            </span>
                          )}
                          {c.pendingCards > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                              <Clock className="size-2.5" />
                              {c.pendingCards}
                            </span>
                          )}
                          {c.activeCards === 0 && c.pendingCards === 0 && <span className="text-muted-foreground/50 text-xs">—</span>}
                        </div>
                      </td>

                      {/* Financial */}
                      <td className="px-4 py-3">
                        {unpaid > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                            <DollarSign className="size-3" />
                            ₪{unpaid.toFixed(0)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50 text-xs">—</span>
                        )}
                      </td>

                      {/* Tags */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {c.tags?.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-[10px] py-0 h-5">{tag}</Badge>
                          ))}
                          {(c.tags?.length ?? 0) > 2 && (
                            <span className="text-[10px] text-muted-foreground">+{c.tags!.length - 2}</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost" size="sm" className="h-7 px-2 text-xs"
                            onClick={() => router.push(`/dashboard/customers/${c.id}`)}
                          >
                            <Eye className="size-3 me-1" />
                            {t("cust.col_details")}
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="h-7 w-7 p-0" />}>
                              <MoreHorizontal className="size-3.5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setBookingCustomer({ name: c.name, phone: c.phone ?? "" })}>
                                <CalendarPlus className="size-3.5 me-2" />
                                {t("cust.book_appointment")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/dashboard/customers/${c.id}`)}>
                                <CreditCard className="size-3.5 me-2" />
                                {t("cust.sell_card")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/dashboard/customers/${c.id}`)}>
                                <StickyNote className="size-3.5 me-2" />
                                {t("cust.add_note_action")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => { startTransition(async () => { await archiveCustomer(c.id); router.refresh(); }); }}
                                className="text-destructive"
                              >
                                <Archive className="size-3.5 me-2" />
                                {t("cust.archive_customer")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Mobile Card List ── */}
          <div className="md:hidden space-y-2">
            {sorted.map((c) => (
              <MobileCustomerCard
                key={c.id}
                customer={c}
                t={t}
                dateLocale={dateLocale}
                selected={selectedIds.has(c.id)}
                onToggleSelect={() => toggleSelect(c.id)}
                onView={() => router.push(`/dashboard/customers/${c.id}`)}
                onBook={() => setBookingCustomer({ name: c.name, phone: c.phone ?? "" })}
                getRelativeDate={getRelativeDate}
                fmtShortDate={fmtShortDate}
              />
            ))}
          </div>
        </>
      )}

      {/* ── Filter Sheet ── */}
      <FilterSheet
        open={filterSheetOpen}
        onOpenChange={setFilterSheetOpen}
        filters={filters}
        onFiltersChange={setFilters}
        sources={allSources}
        t={t}
      />

      {/* ── Booking Sheet ── */}
      {bookingCustomer && (
        <BookingCalendarSheet
          open={!!bookingCustomer}
          onOpenChange={(open) => { if (!open) setBookingCustomer(null); }}
          businessId={businessId}
          customer={bookingCustomer}
          staff={staff}
          services={services}
          serviceStaffLinks={serviceStaffLinks}
        />
      )}

      <AddCustomerDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </div>
  );
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, alert }: { icon: React.ReactNode; label: string; value: number; alert?: boolean }) {
  return (
    <Card className="relative">
      <CardContent className="p-3">
        <div className="flex items-center gap-1.5 mb-0.5">
          {icon}
          <span className="text-[11px] text-muted-foreground truncate">{label}</span>
        </div>
        <p className="text-xl font-bold tabular-nums">{value}</p>
        {alert && <span className="absolute top-2 end-2 size-2 rounded-full bg-red-500 animate-pulse" />}
      </CardContent>
    </Card>
  );
}

// ─── Customer Avatar ─────────────────────────────────────────────────────────

function CustomerAvatar({ name, attention }: { name: string; attention?: boolean }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="relative">
      <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
        {initials}
      </div>
      {attention && (
        <span className="absolute -top-0.5 -end-0.5 size-2.5 rounded-full bg-amber-500 ring-2 ring-background" />
      )}
    </div>
  );
}

// ─── Mobile Customer Card ────────────────────────────────────────────────────

function MobileCustomerCard({
  customer: c,
  t,
  selected,
  onToggleSelect,
  onView,
  onBook,
  getRelativeDate,
  fmtShortDate,
}: {
  customer: CustomerRow;
  t: ReturnType<typeof useT>;
  dateLocale: string;
  selected: boolean;
  onToggleSelect: () => void;
  onView: () => void;
  onBook: () => void;
  getRelativeDate: (d: string | Date) => string;
  fmtShortDate: (d: string | Date) => string;
}) {
  const unpaid = parseFloat(c.unpaidBalance) || 0;
  const attention = c.noShowCount >= 3 || unpaid > 0 || c.pendingCards > 0 || c.status === "BLOCKED" || !c.phone;

  return (
    <Card className={`overflow-hidden transition-colors ${selected ? "ring-2 ring-primary/30 bg-primary/5" : ""}`}>
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {/* Select + Avatar */}
          <div className="flex flex-col items-center gap-1 pt-0.5">
            <button type="button" onClick={onToggleSelect} className="text-muted-foreground">
              {selected ? <CheckSquare className="size-4 text-primary" /> : <Square className="size-4" />}
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Top Row: Name + Status */}
            <div className="flex items-center gap-2 mb-1">
              <CustomerAvatar name={c.name} attention={attention} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={onView} className="font-semibold text-sm truncate hover:underline">
                    {c.name}
                  </button>
                  <span className={`shrink-0 inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${STATUS_BADGE[c.status] ?? ""}`}>
                    {t(`cust.status_${c.status.toLowerCase()}` as Parameters<typeof t>[0])}
                  </span>
                </div>
                {c.phone && (
                  <p className="text-xs text-muted-foreground" dir="ltr">{c.phone}</p>
                )}
                {!c.phone && (
                  <p className="text-xs text-amber-600 font-medium">{t("cust.no_phone")}</p>
                )}
              </div>
            </div>

            {/* Info Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {c.nextAppointmentDate && (
                <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                  <CalendarPlus className="size-3" />
                  {fmtShortDate(c.nextAppointmentDate)}
                </span>
              )}
              {c.activeCards > 0 && (
                <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                  <CreditCard className="size-3" />
                  {t("cust.active_cards_badge", { n: c.activeCards })}
                </span>
              )}
              {c.pendingCards > 0 && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                  <Clock className="size-3" />
                  {t("cust.pending_cards_badge", { n: c.pendingCards })}
                </span>
              )}
              {unpaid > 0 && (
                <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:bg-red-900/20 dark:text-red-400">
                  <DollarSign className="size-3" />
                  ₪{unpaid.toFixed(0)}
                </span>
              )}
              {c.noShowCount >= 3 && (
                <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-700 dark:bg-orange-900/20 dark:text-orange-400">
                  <AlertTriangle className="size-3" />
                  {c.noShowCount}
                </span>
              )}
              {c.lastVisitDate && (
                <span className="text-[11px] text-muted-foreground">
                  {t("cust.last_visit")}: {getRelativeDate(c.lastVisitDate)}
                </span>
              )}
            </div>

            {/* Tags */}
            {c.tags && c.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {c.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-[10px] py-0 h-4">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1 mt-2.5 pt-2.5 border-t">
          {c.phone && (
            <>
              <Button variant="ghost" size="sm" className="h-8 flex-1 text-xs" render={<a href={telLink(c.phone)} />}>
                <Phone className="size-3.5 me-1" />
                {t("cust.quick_call")}
              </Button>
              <Button variant="ghost" size="sm" className="h-8 flex-1 text-xs" render={<a href={whatsappLink(c.phone)} target="_blank" rel="noopener noreferrer" />}>
                <MessageCircle className="size-3.5 me-1" />
                WhatsApp
              </Button>
            </>
          )}
          <Button variant="ghost" size="sm" className="h-8 flex-1 text-xs" onClick={onBook}>
            <CalendarPlus className="size-3.5 me-1" />
            {t("cust.book")}
          </Button>
          <Button variant="default" size="sm" className="h-8 flex-1 text-xs" onClick={onView}>
            <Eye className="size-3.5 me-1" />
            {t("cust.view_profile")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Filter Sheet ────────────────────────────────────────────────────────────

const STATUSES = ["LEAD", "ACTIVE", "INACTIVE", "BLOCKED", "ARCHIVED"] as const;

function FilterSheet({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  sources,
  t,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: Filters;
  onFiltersChange: (f: Filters) => void;
  sources: string[];
  t: ReturnType<typeof useT>;
}) {
  const [draft, setDraft] = useState(filters);

  const handleOpen = useCallback((v: boolean) => {
    if (v) setDraft(filters);
    onOpenChange(v);
  }, [filters, onOpenChange]);

  function apply() {
    onFiltersChange(draft);
    onOpenChange(false);
  }

  function clear() {
    setDraft(EMPTY_FILTERS);
    onFiltersChange(EMPTY_FILTERS);
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("cust.filters")}</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Status */}
          <section>
            <Label className="text-sm font-medium mb-3 block">{t("cust.filter_status")}</Label>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => {
                const active = draft.statuses.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setDraft((prev) => ({
                        ...prev,
                        statuses: active
                          ? prev.statuses.filter((x) => x !== s)
                          : [...prev.statuses, s],
                      }));
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors border
                      ${active
                        ? `${STATUS_BADGE[s]} border-current`
                        : "bg-background text-muted-foreground border-border hover:border-foreground/30"
                      }`}
                  >
                    {t(`cust.status_${s.toLowerCase()}` as Parameters<typeof t>[0])}
                  </button>
                );
              })}
            </div>
          </section>

          <Separator />

          {/* Cards */}
          <section className="space-y-3">
            <Label className="text-sm font-medium block">{t("cust.filter_cards")}</Label>
            <SwitchRow
              label={t("cust.filter_has_active_cards")}
              checked={draft.hasActiveCards}
              onChange={(v) => setDraft((p) => ({ ...p, hasActiveCards: v }))}
            />
            <SwitchRow
              label={t("cust.filter_has_pending_cards")}
              checked={draft.hasPendingCards}
              onChange={(v) => setDraft((p) => ({ ...p, hasPendingCards: v }))}
            />
          </section>

          <Separator />

          {/* Financial */}
          <section className="space-y-3">
            <Label className="text-sm font-medium block">{t("cust.filter_financial")}</Label>
            <SwitchRow
              label={t("cust.filter_has_unpaid")}
              checked={draft.hasUnpaid}
              onChange={(v) => setDraft((p) => ({ ...p, hasUnpaid: v }))}
            />
            <SwitchRow
              label={t("cust.filter_no_show_risk")}
              checked={draft.noShowRisk}
              onChange={(v) => setDraft((p) => ({ ...p, noShowRisk: v }))}
            />
          </section>

          {/* Source */}
          {sources.length > 0 && (
            <>
              <Separator />
              <section>
                <Label className="text-sm font-medium mb-3 block">{t("cust.filter_source")}</Label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setDraft((p) => ({ ...p, source: "" }))}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors
                      ${draft.source === "" ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border"}`}
                  >
                    {t("cust.view_all_customers")}
                  </button>
                  {sources.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setDraft((p) => ({ ...p, source: p.source === s ? "" : s }))}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors
                        ${draft.source === s ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>

        <div className="flex gap-2 mt-8 pt-4 border-t">
          <Button variant="outline" className="flex-1" onClick={clear}>
            {t("cust.clear_filters")}
          </Button>
          <Button className="flex-1" onClick={apply}>
            {t("common.confirm")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SwitchRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

// ─── Sort Header ─────────────────────────────────────────────────────────────

function SortTh({
  col,
  label,
  sortKey,
  sortDir,
  onSort,
}: {
  col: SortKey;
  label: string;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const isActive = sortKey === col;
  return (
    <th className="whitespace-nowrap px-4 py-3 text-start font-medium">
      <button
        type="button"
        className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
        onClick={() => onSort(col)}
      >
        {label}
        {isActive
          ? (sortDir === "asc" ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />)
          : <ArrowUpDown className="size-3 opacity-40" />}
      </button>
    </th>
  );
}

// ─── Add Customer Dialog ─────────────────────────────────────────────────────

function AddCustomerDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName("");
    setPhone("");
    setEmail("");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError(t("cust.add_error_required"));
      return;
    }

    startTransition(async () => {
      const result = await addCustomer({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
      });

      if (result.success) {
        onOpenChange(false);
        reset();
        router.refresh();
      } else {
        setError(
          result.error?.includes("already exists")
            ? t("cust.add_error_exists")
            : result.error ?? t("cust.add_error_required")
        );
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent dir={locale === "he" ? "rtl" : "ltr"} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-5" />
            {t("cust.add_customer")}
          </DialogTitle>
          <DialogDescription>{t("cust.add_customer_desc")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("cust.add_name")}</Label>
            <Input
              value={name}
              onChange={(e) => { setName(e.target.value); setError(null); }}
              placeholder={t("cust.add_name")}
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("cust.add_phone")}</Label>
            <Input
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setError(null); }}
              placeholder="05X-XXXXXXX"
              dir="ltr"
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("cust.add_email")}</Label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              type="email"
              dir="ltr"
              disabled={isPending}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="flex-row gap-2 sm:flex-row pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => { onOpenChange(false); reset(); }}
              disabled={isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? (
                <Loader2 className="size-4 me-1.5 animate-spin" />
              ) : (
                <UserPlus className="size-4 me-1.5" />
              )}
              {t("cust.add_customer")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
