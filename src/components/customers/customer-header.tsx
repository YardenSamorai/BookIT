"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Pencil,
  CalendarPlus,
  CreditCard,
  StickyNote,
  MoreHorizontal,
  Phone,
  Mail,
  Clock,
  MessageCircle,
} from "lucide-react";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { telLink, whatsappLink } from "@/lib/utils/phone";
import { archiveCustomer, updateCustomerStatus } from "@/actions/customers";
import type { CustomerProfile } from "@/lib/db/queries/customers";

const STATUS_BADGE: Record<string, string> = {
  LEAD: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  INACTIVE: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  BLOCKED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  ARCHIVED: "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500",
};

const LIFECYCLE_STATUSES = ["LEAD", "ACTIVE", "INACTIVE", "BLOCKED", "ARCHIVED"] as const;

interface Props {
  customer: CustomerProfile;
  onEdit: () => void;
  onBook: () => void;
  onAssignCard: () => void;
  onSwitchTab: (tab: string) => void;
  onRefresh: () => void;
}

export function CustomerHeader({
  customer,
  onEdit,
  onBook,
  onAssignCard,
  onSwitchTab,
  onRefresh,
}: Props) {
  const t = useT();
  const locale = useLocale();
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const joinDate = new Date(customer.createdAt).toLocaleDateString(
    locale === "he" ? "he-IL" : "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  const initials = customer.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleArchive() {
    await archiveCustomer(customer.id);
    setArchiveOpen(false);
    onRefresh();
  }

  async function handleStatusChange(status: (typeof LIFECYCLE_STATUSES)[number]) {
    await updateCustomerStatus(customer.id, status);
    setStatusOpen(false);
    onRefresh();
  }

  return (
    <>
      {/* Desktop header */}
      <div className="sticky top-0 z-10 hidden md:block rounded-lg border bg-background/95 backdrop-blur p-4">
        <div className="flex items-center gap-4">
          <Avatar className="size-14 shrink-0">
            <AvatarImage src={customer.avatarUrl ?? undefined} />
            <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold truncate">{customer.name}</h1>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[customer.status] ?? ""}`}>
                {t(`cust.status_${customer.status.toLowerCase()}` as Parameters<typeof t>[0])}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
              {customer.phone && (
                <a href={telLink(customer.phone)} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                  <Phone className="size-3.5" />
                  <span dir="ltr">{customer.phone}</span>
                </a>
              )}
              {customer.email && (
                <a href={`mailto:${customer.email}`} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                  <Mail className="size-3.5" />
                  {customer.email}
                </a>
              )}
              {customer.phone && (
                <a href={whatsappLink(customer.phone)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                  <MessageCircle className="size-3.5" />
                  WhatsApp
                </a>
              )}
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5" />
                {t("cust.joined")} {joinDate}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Pencil className="size-3.5 me-1.5" />
              {t("cust.edit_profile")}
            </Button>
            <Button size="sm" variant="outline" onClick={onBook}>
              <CalendarPlus className="size-3.5 me-1.5" />
              {t("cust.book_appointment")}
            </Button>
            <Button size="sm" variant="outline" onClick={onAssignCard}>
              <CreditCard className="size-3.5 me-1.5" />
              {t("cust.assign_card")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => onSwitchTab("notes")}>
              <StickyNote className="size-3.5 me-1.5" />
              {t("cust.add_note_action")}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button size="sm" variant="ghost" className="size-8 p-0" />}
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setStatusOpen(true)}>
                  {t("cust.change_status")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setArchiveOpen(true)}
                  className="text-destructive"
                >
                  {t("cust.archive_customer")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile header */}
      <div className="sticky top-0 z-10 md:hidden rounded-lg border bg-background/95 backdrop-blur p-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-10 shrink-0">
            <AvatarImage src={customer.avatarUrl ?? undefined} />
            <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold truncate">{customer.name}</h1>
              <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${STATUS_BADGE[customer.status] ?? ""}`}>
                {t(`cust.status_${customer.status.toLowerCase()}` as Parameters<typeof t>[0])}
              </span>
            </div>
            <div className="mt-0.5 flex gap-3 text-muted-foreground">
              {customer.phone && (
                <a href={telLink(customer.phone)} className="p-1">
                  <Phone className="size-4" />
                </a>
              )}
              {customer.email && (
                <a href={`mailto:${customer.email}`} className="p-1">
                  <Mail className="size-4" />
                </a>
              )}
              {customer.phone && (
                <a href={whatsappLink(customer.phone)} target="_blank" rel="noopener noreferrer" className="p-1">
                  <MessageCircle className="size-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Archive confirmation dialog */}
      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("cust.archive_customer")}</DialogTitle>
            <DialogDescription>
              {t("cust.archive_confirm", { name: customer.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleArchive}>
              {t("cust.archive_customer")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status change dialog */}
      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("cust.change_status")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {LIFECYCLE_STATUSES.map((s) => (
              <Button
                key={s}
                variant={customer.status === s ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => handleStatusChange(s)}
                disabled={customer.status === s}
              >
                <span className={`me-2 inline-block size-2 rounded-full ${STATUS_BADGE[s]?.split(" ")[0] ?? ""}`} />
                {t(`cust.status_${s.toLowerCase()}` as Parameters<typeof t>[0])}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
