"use client";

import { useState, useCallback } from "react";
import { Filter, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Staff, FilterState } from "./calendar-types";
import { STAFF_COLORS, hasActiveFilters } from "./calendar-types";

interface FilterBarProps {
  staff: Staff[];
  services: { id: string; title: string }[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

const STATUS_OPTIONS = [
  { value: "CONFIRMED", label: "מאושר", dot: "bg-emerald-500" },
  { value: "PENDING", label: "ממתין", dot: "bg-amber-500" },
  { value: "COMPLETED", label: "הושלם", dot: "bg-slate-400" },
  { value: "NO_SHOW", label: "לא הגיע", dot: "bg-red-500" },
];

export function FilterBar({ staff, services, filters, onFiltersChange }: FilterBarProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const activeCount =
    filters.staffIds.length +
    filters.serviceIds.length +
    filters.statuses.length +
    (filters.needsAttention ? 1 : 0);

  const clearAll = useCallback(() => {
    onFiltersChange({ staffIds: [], serviceIds: [], statuses: [], needsAttention: false });
  }, [onFiltersChange]);

  const toggleStaff = useCallback((id: string) => {
    onFiltersChange({
      ...filters,
      staffIds: filters.staffIds.includes(id)
        ? filters.staffIds.filter((s) => s !== id)
        : [...filters.staffIds, id],
    });
  }, [filters, onFiltersChange]);

  const toggleService = useCallback((id: string) => {
    onFiltersChange({
      ...filters,
      serviceIds: filters.serviceIds.includes(id)
        ? filters.serviceIds.filter((s) => s !== id)
        : [...filters.serviceIds, id],
    });
  }, [filters, onFiltersChange]);

  const toggleStatus = useCallback((status: string) => {
    onFiltersChange({
      ...filters,
      statuses: filters.statuses.includes(status)
        ? filters.statuses.filter((s) => s !== status)
        : [...filters.statuses, status],
    });
  }, [filters, onFiltersChange]);

  const toggleNeedsAttention = useCallback(() => {
    onFiltersChange({
      ...filters,
      needsAttention: !filters.needsAttention,
    });
  }, [filters, onFiltersChange]);

  return (
    <>
      {/* Desktop filter bar */}
      <div className="hidden md:flex items-center gap-2 flex-wrap">
        {/* Staff pills */}
        {staff.length > 1 && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground me-1">צוות:</span>
            {staff.map((s, i) => {
              const clr = STAFF_COLORS[i % STAFF_COLORS.length];
              const active = filters.staffIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleStaff(s.id)}
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    active
                      ? "ring-1 ring-offset-1"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted"
                  }`}
                  style={
                    active
                      ? {
                          backgroundColor: clr.bg,
                          color: clr.text,
                          borderColor: clr.border,
                          // @ts-expect-error CSS var for ring
                          "--tw-ring-color": clr.border,
                        }
                      : undefined
                  }
                >
                  <span
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: clr.border }}
                  />
                  {s.name.split(" ")[0]}
                </button>
              );
            })}
          </div>
        )}

        {/* Status chips */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground me-1">סטטוס:</span>
          {STATUS_OPTIONS.map((opt) => {
            const active = filters.statuses.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => toggleStatus(opt.value)}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "bg-foreground text-background"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                }`}
              >
                <span className={`size-1.5 rounded-full ${opt.dot}`} />
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Needs attention toggle */}
        <button
          onClick={toggleNeedsAttention}
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
            filters.needsAttention
              ? "bg-amber-100 text-amber-800"
              : "bg-muted/60 text-muted-foreground hover:bg-muted"
          }`}
        >
          <AlertCircle className="size-3" />
          דורש טיפול
        </button>

        {/* Clear all */}
        {hasActiveFilters(filters) && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="size-3" />
            נקה הכל
          </button>
        )}
      </div>

      {/* Mobile: filter button + sheet */}
      <div className="md:hidden flex items-center gap-2">
        {/* Quick needs-attention chip */}
        <button
          onClick={toggleNeedsAttention}
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
            filters.needsAttention
              ? "bg-amber-100 text-amber-800"
              : "bg-muted/60 text-muted-foreground hover:bg-muted"
          }`}
        >
          <AlertCircle className="size-3" />
          דורש טיפול
        </button>

        <Button
          variant="outline"
          size="sm"
          className="relative"
          onClick={() => setSheetOpen(true)}
        >
          <Filter className="size-3.5 me-1" />
          סינון
          {activeCount > 0 && (
            <span className="absolute -top-1.5 -end-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="bottom" className="max-h-[70dvh] overflow-y-auto rounded-t-xl">
            <SheetHeader className="pb-4">
              <SheetTitle>סינון יומן</SheetTitle>
            </SheetHeader>

            {/* Staff section */}
            {staff.length > 1 && (
              <FilterSection title="צוות">
                <div className="flex flex-wrap gap-2">
                  {staff.map((s, i) => {
                    const clr = STAFF_COLORS[i % STAFF_COLORS.length];
                    const active = filters.staffIds.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        onClick={() => toggleStaff(s.id)}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                          active
                            ? "ring-1 ring-offset-1"
                            : "bg-muted/60 text-muted-foreground"
                        }`}
                        style={
                          active
                            ? {
                                backgroundColor: clr.bg,
                                color: clr.text,
                                // @ts-expect-error CSS var for ring
                                "--tw-ring-color": clr.border,
                              }
                            : undefined
                        }
                      >
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: clr.border }}
                        />
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </FilterSection>
            )}

            {/* Service section */}
            {services.length > 1 && (
              <FilterSection title="שירות">
                <div className="flex flex-wrap gap-2">
                  {services.map((svc) => {
                    const active = filters.serviceIds.includes(svc.id);
                    return (
                      <button
                        key={svc.id}
                        onClick={() => toggleService(svc.id)}
                        className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                          active
                            ? "bg-foreground text-background"
                            : "bg-muted/60 text-muted-foreground"
                        }`}
                      >
                        {svc.title}
                      </button>
                    );
                  })}
                </div>
              </FilterSection>
            )}

            {/* Status section */}
            <FilterSection title="סטטוס">
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((opt) => {
                  const active = filters.statuses.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      onClick={() => toggleStatus(opt.value)}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                        active
                          ? "bg-foreground text-background"
                          : "bg-muted/60 text-muted-foreground"
                      }`}
                    >
                      <span className={`size-2 rounded-full ${opt.dot}`} />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </FilterSection>

            <div className="flex items-center gap-3 pt-4">
              <Button onClick={() => setSheetOpen(false)} className="flex-1">
                החל
              </Button>
              {hasActiveFilters(filters) && (
                <Button variant="outline" onClick={clearAll}>
                  נקה הכל
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-3 border-b last:border-b-0">
      <h4 className="text-sm font-semibold mb-2">{title}</h4>
      {children}
    </div>
  );
}
