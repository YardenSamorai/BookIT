"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { Users, Search, Calendar, XCircle, AlertTriangle } from "lucide-react";
import type { CustomerRow } from "@/lib/db/queries/customers";

interface CustomerListProps {
  customers: CustomerRow[];
}

export function CustomerList({ customers }: CustomerListProps) {
  const t = useT();
  const locale = useLocale();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q)
    );
  }, [customers, search]);

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
      <div className="relative max-w-sm">
        <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("cust.search_ph")}
          className="ps-9"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Users className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t("cust.no_customers")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((customer) => (
            <CustomerCard key={customer.id} customer={customer} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}

function CustomerCard({
  customer,
  locale,
}: {
  customer: CustomerRow;
  locale: "en" | "he";
}) {
  const t = useT();
  const router = useRouter();

  const joinDate = new Date(customer.createdAt).toLocaleDateString(
    locale === "he" ? "he-IL" : "en-US",
    { year: "numeric", month: "short", day: "numeric" }
  );

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-muted/50"
      onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
    >
      <CardContent className="space-y-3 pt-4">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <span className="text-lg font-semibold">
              {customer.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{customer.name}</p>
            {customer.phone && (
              <p className="truncate text-sm text-muted-foreground" dir="ltr">
                {customer.phone}
              </p>
            )}
            {customer.email && (
              <p className="truncate text-sm text-muted-foreground">
                {customer.email}
              </p>
            )}
          </div>
        </div>

        {customer.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {customer.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 border-t pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="size-3.5" />
            {customer.appointmentCount} {t("cust.appointments")}
          </span>
          {customer.cancellationCount > 0 && (
            <span className="flex items-center gap-1 text-orange-500">
              <XCircle className="size-3.5" />
              {customer.cancellationCount}
            </span>
          )}
          {customer.noShowCount > 0 && (
            <span className="flex items-center gap-1 text-red-500">
              <AlertTriangle className="size-3.5" />
              {customer.noShowCount}
            </span>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          {t("cust.joined")} {joinDate}
        </p>
      </CardContent>
    </Card>
  );
}
