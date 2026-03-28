"use client";

import { useMemo, useState } from "react";
import { Search, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  createdAt: Date | string;
};

type SortKey = "name" | "email" | "phone" | "role" | "createdAt";
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

export function AdminUsersClient({ users }: { users: AdminUserRow[] }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "createdAt" ? "desc" : "asc");
    }
  }

  const filtered = useMemo(() => {
    const list = users.filter((u) => {
      if (roleFilter && u.role !== roleFilter) return false;
      if (search) {
        const q = search.toLowerCase().trim();
        const nameMatch = u.name.toLowerCase().includes(q);
        const emailMatch = (u.email ?? "").toLowerCase().includes(q);
        const phoneMatch = (u.phone ?? "").includes(search.trim());
        if (!nameMatch && !emailMatch && !phoneMatch) return false;
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
        case "createdAt":
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [users, search, roleFilter, sortKey, sortDir]);

  const columns: { key: SortKey; label: string }[] = [
    { key: "name", label: "שם" },
    { key: "email", label: "אימייל" },
    { key: "phone", label: "טלפון" },
    { key: "role", label: "תפקיד" },
    { key: "createdAt", label: "נוצר" },
  ];

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] max-w-sm flex-1">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="חיפוש לפי שם, אימייל או טלפון..."
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
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
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
