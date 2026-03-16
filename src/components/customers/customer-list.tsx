"use client";

import { useState, useMemo, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import {
  Users,
  Search,
  Download,
  Upload,
  Eye,
  CalendarPlus,
  Trash2,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { importCustomers, deleteCustomer } from "@/actions/customers";
import type { CustomerRow } from "@/lib/db/queries/customers";

interface CustomerListProps {
  customers: CustomerRow[];
}

type SortKey = "name" | "phone" | "createdAt" | "lastAppointmentDate" | "appointmentCount";
type SortDir = "asc" | "desc";

export function CustomerList({ customers }: CustomerListProps) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const dateLocale = locale === "he" ? "he-IL" : "en-US";

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sorted = useMemo(() => {
    let list = customers;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "name":
          return dir * a.name.localeCompare(b.name, locale);
        case "phone":
          return dir * (a.phone ?? "").localeCompare(b.phone ?? "");
        case "createdAt":
          return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        case "lastAppointmentDate": {
          const da = a.lastAppointmentDate ? new Date(a.lastAppointmentDate).getTime() : 0;
          const db = b.lastAppointmentDate ? new Date(b.lastAppointmentDate).getTime() : 0;
          return dir * (da - db);
        }
        case "appointmentCount":
          return dir * (a.appointmentCount - b.appointmentCount);
        default:
          return 0;
      }
    });
  }, [customers, search, sortKey, sortDir, locale]);

  async function handleExport() {
    const { utils, writeFile } = await import("xlsx");
    const data = customers.map((c) => ({
      [t("cust.col_name")]: c.name,
      [t("cust.phone")]: c.phone ?? "",
      [t("cust.email")]: c.email ?? "",
      [t("cust.col_registered")]: fmtDate(c.createdAt),
      [t("cust.col_last_apt")]: c.lastAppointmentDate ? fmtDate(c.lastAppointmentDate) : "",
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
      const name =
        r["name"] || r["Name"] || r["שם"] || r["שם מלא"] || r["שם לקוח"] || "";
      const phone =
        r["phone"] || r["Phone"] || r["טלפון"] || r["מספר טלפון"] || r["נייד"] || "";
      const email = r["email"] || r["Email"] || r["אימייל"] || r["מייל"] || "";
      return { name, phone, email: email || undefined };
    });

    const valid = mapped.filter((r) => r.name && r.phone);
    if (valid.length === 0) {
      alert(t("cust.import_no_valid"));
      return;
    }

    startTransition(async () => {
      const result = await importCustomers(valid);
      if (result.success) {
        alert(t("cust.import_done").replace("{imported}", String(result.data.imported)).replace("{skipped}", String(result.data.skipped)));
        router.refresh();
      }
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleDelete(customerId: string, customerName: string) {
    if (!confirm(t("cust.delete_confirm").replace("{name}", customerName))) return;
    startTransition(async () => {
      await deleteCustomer(customerId);
      router.refresh();
    });
  }

  function fmtDate(d: string | Date) {
    return new Date(d).toLocaleDateString(dateLocale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown className="size-3 opacity-40" />;
    return sortDir === "asc" ? (
      <ChevronUp className="size-3" />
    ) : (
      <ChevronDown className="size-3" />
    );
  }

  if (customers.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <Users className="size-10 text-muted-foreground" />
          <div>
            <p className="font-medium">{t("cust.no_customers")}</p>
            <p className="text-sm text-muted-foreground">
              {t("cust.no_customers_desc")}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("cust.search_ph")}
            className="ps-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="size-4 me-1.5" />
            {t("cust.export_excel")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
          >
            <Upload className="size-4 me-1.5" />
            {t("cust.import_excel")}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleImport}
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {customers.length} {t("cust.title")}
      </p>

      {sorted.length === 0 && search ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Users className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t("cust.no_customers")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-muted-foreground">
                <Th col="name" label={t("cust.col_name")} sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>
                  <SortIcon col="name" />
                </Th>
                <Th col="phone" label={t("cust.phone")} sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>
                  <SortIcon col="phone" />
                </Th>
                <Th col="createdAt" label={t("cust.col_registered")} sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>
                  <SortIcon col="createdAt" />
                </Th>
                <Th col="lastAppointmentDate" label={t("cust.col_last_apt")} sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>
                  <SortIcon col="lastAppointmentDate" />
                </Th>
                <Th col="appointmentCount" label={t("cust.appointments")} sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>
                  <SortIcon col="appointmentCount" />
                </Th>
                <th className="whitespace-nowrap px-4 py-3 text-start font-medium">
                  {t("cust.col_actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => (
                <tr
                  key={c.id}
                  className="border-b last:border-0 transition-colors hover:bg-muted/30"
                >
                  <td className="whitespace-nowrap px-4 py-3 font-medium">{c.name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground" dir="ltr">
                    {c.phone ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {fmtDate(c.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {c.lastAppointmentDate ? fmtDate(c.lastAppointmentDate) : t("cust.no_apts")}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-center">
                    <span className={`inline-flex size-7 items-center justify-center rounded-full text-xs font-semibold ${c.appointmentCount > 0 ? "bg-indigo-50 text-indigo-700" : "bg-muted text-muted-foreground"}`}>
                      {c.appointmentCount}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => router.push(`/dashboard/customers/${c.id}`)}
                      >
                        <Eye className="size-3 me-1" />
                        {t("cust.col_details")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => router.push(`/dashboard/calendar`)}
                      >
                        <CalendarPlus className="size-3 me-1" />
                        {t("cust.col_book")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                        onClick={() => handleDelete(c.id, c.name)}
                        disabled={isPending}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({
  col,
  label,
  sortKey,
  sortDir,
  onSort,
  children,
}: {
  col: SortKey;
  label: string;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
  children: React.ReactNode;
}) {
  return (
    <th className="whitespace-nowrap px-4 py-3 text-start font-medium">
      <button
        type="button"
        className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
        onClick={() => onSort(col)}
      >
        {label}
        {children}
      </button>
    </th>
  );
}
