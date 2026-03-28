"use client";

import { useMemo, useState } from "react";
import { Search, ArrowUp, ArrowDown, ArrowUpDown, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  createdAt: Date | string;
  businesses: { id: string; name: string }[];
};

type SortKey = "name" | "email" | "phone" | "role" | "businesses" | "createdAt" | "tenure";
type SortDir = "asc" | "desc";

const ROLE_ORDER: Record<string, number> = {
  CUSTOMER: 0,
  BUSINESS_OWNER: 1,
  BOTH: 2,
  SUPER_ADMIN: 3,
};

const ROLE_STYLES: Record<string, string> = {
  CUSTOMER: "bg-slate-100 text-slate-600",
  BUSINESS_OWNER: "bg-blue-100 text-blue-700",
  BOTH: "bg-violet-100 text-violet-700",
  SUPER_ADMIN: "bg-red-100 text-red-700",
};

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active)
    return (
      <ArrowUpDown className="size-3 opacity-0 transition-opacity group-hover:opacity-40" />
    );
  return dir === "asc" ? (
    <ArrowUp className="size-3 text-blue-600" />
  ) : (
    <ArrowDown className="size-3 text-blue-600" />
  );
}

function cellText(value: string | null): string {
  return value ?? "";
}

function formatTenure(createdAt: Date | string): string {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (days < 1) return "היום";
  if (days === 1) return "יום אחד";
  if (days < 7) return `${days} ימים`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? "שבוע" : `${weeks} שבועות`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    return months === 1 ? "חודש" : `${months} חודשים`;
  }
  const years = Math.floor(days / 365);
  const remainMonths = Math.floor((days % 365) / 30);
  if (remainMonths === 0) return years === 1 ? "שנה" : `${years} שנים`;
  return `${years === 1 ? "שנה" : `${years} שנים`} ו-${remainMonths} חודשים`;
}

export function AdminUsersClient({ users }: { users: AdminUserRow[] }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [bizFilter, setBizFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const allBusinesses = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of users) {
      for (const b of u.businesses) {
        map.set(b.id, b.name);
      }
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], "he"));
  }, [users]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "createdAt" || key === "tenure" ? "desc" : "asc");
    }
  }

  const filtered = useMemo(() => {
    const list = users.filter((u) => {
      if (roleFilter && u.role !== roleFilter) return false;
      if (bizFilter && !u.businesses.some((b) => b.id === bizFilter)) return false;
      if (search) {
        const q = search.toLowerCase().trim();
        const nameMatch = u.name.toLowerCase().includes(q);
        const emailMatch = (u.email ?? "").toLowerCase().includes(q);
        const phoneMatch = (u.phone ?? "").includes(search.trim());
        const bizMatch = u.businesses.some((b) => b.name.toLowerCase().includes(q));
        if (!nameMatch && !emailMatch && !phoneMatch && !bizMatch) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name, "he");
          break;
        case "email":
          cmp = cellText(a.email).localeCompare(cellText(b.email), "he", {
            sensitivity: "base",
          });
          break;
        case "phone":
          cmp = cellText(a.phone).localeCompare(cellText(b.phone), "he");
          break;
        case "role":
          cmp = (ROLE_ORDER[a.role] ?? 99) - (ROLE_ORDER[b.role] ?? 99);
          break;
        case "businesses":
          cmp = a.businesses.length - b.businesses.length;
          break;
        case "createdAt":
        case "tenure":
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [users, search, roleFilter, bizFilter, sortKey, sortDir]);

  const columns: { key: SortKey; label: string }[] = [
    { key: "name", label: "שם" },
    { key: "email", label: "אימייל" },
    { key: "phone", label: "טלפון" },
    { key: "role", label: "תפקיד" },
    { key: "businesses", label: "עסקים" },
    { key: "tenure", label: "זמן במערכת" },
    { key: "createdAt", label: "נוצר" },
  ];

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] max-w-sm flex-1">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="חיפוש לפי שם, אימייל, טלפון או עסק..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">כל התפקידים</option>
          <option value="CUSTOMER">CUSTOMER</option>
          <option value="BUSINESS_OWNER">BUSINESS_OWNER</option>
          <option value="BOTH">BOTH</option>
          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
        </select>
        <select
          value={bizFilter}
          onChange={(e) => setBizFilter(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">כל העסקים</option>
          {allBusinesses.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
        <span className="text-sm text-muted-foreground">
          {filtered.length} מתוך {users.length} משתמשים
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-right">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className="group cursor-pointer select-none px-4 py-3 font-medium text-muted-foreground transition-colors hover:text-slate-900"
                >
                  <span className="inline-flex items-center gap-1.5">
                    {col.label}
                    <SortIcon active={sortKey === col.key} dir={sortDir} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  לא נמצאו תוצאות
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-900">{u.name}</td>
                  <td className="px-4 py-3 text-slate-700" dir="ltr">
                    {u.email ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-700" dir="ltr">
                    {u.phone ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ROLE_STYLES[u.role] ?? ROLE_STYLES.CUSTOMER}`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.businesses.length === 0 ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {u.businesses.map((b) => (
                          <span
                            key={b.id}
                            className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700"
                          >
                            <Building2 className="size-2.5" />
                            {b.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                    {formatTenure(u.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString("he-IL", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
