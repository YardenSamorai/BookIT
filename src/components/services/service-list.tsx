"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { deleteService, getServiceAppointmentCount } from "@/actions/services";
import { ServiceStaffEditor } from "./service-staff-editor";
import type { InferSelectModel } from "drizzle-orm";
import type { services, serviceCategories, staffMembers } from "@/lib/db/schema";
import { AlertTriangle, Clock, Loader2, MoreVertical, Pencil, Scissors, Trash2, Users } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";
import type { TranslationKey } from "@/lib/i18n";

type Service = InferSelectModel<typeof services>;

const PAYMENT_MODE_LABEL_KEY: Record<Service["paymentMode"], TranslationKey> = {
  FULL: "svc.mode_FULL",
  DEPOSIT: "svc.mode_DEPOSIT",
  ON_SITE: "svc.mode_ON_SITE",
  CONTACT_FOR_PRICE: "svc.mode_CONTACT_FOR_PRICE",
  FREE: "svc.mode_FREE",
};
type Category = InferSelectModel<typeof serviceCategories>;
type StaffMember = InferSelectModel<typeof staffMembers>;

interface ServiceListProps {
  services: Service[];
  categories: Category[];
  staff: StaffMember[];
  serviceStaffLinks: Array<{ serviceId: string; staffId: string }>;
}

export function ServiceList({ services: serviceList, categories, staff, serviceStaffLinks }: ServiceListProps) {
  const t = useT();

  if (serviceList.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <Scissors className="size-10 text-muted-foreground" />
          <div>
            <p className="font-medium">{t("svc.no_services")}</p>
            <p className="text-sm text-muted-foreground">
              {t("svc.no_services_desc")}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {serviceList.map((svc) => {
        const linkedStaffIds = serviceStaffLinks
          .filter((l) => l.serviceId === svc.id)
          .map((l) => l.staffId);
        const linkedStaff = staff.filter((s) => linkedStaffIds.includes(s.id));
        return (
          <ServiceRow
            key={svc.id}
            service={svc}
            categories={categories}
            staff={staff}
            linkedStaff={linkedStaff}
            linkedStaffIds={linkedStaffIds}
          />
        );
      })}
    </div>
  );
}

function ServiceRow({
  service: svc,
  categories,
  staff,
  linkedStaff,
  linkedStaffIds,
}: {
  service: Service;
  categories: Category[];
  staff: StaffMember[];
  linkedStaff: StaffMember[];
  linkedStaffIds: string[];
}) {
  const router = useRouter();
  const t = useT();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);
  const [appointmentCount, setAppointmentCount] = useState(0);
  const [loadingCount, setLoadingCount] = useState(false);

  const category = categories.find((c) => c.id === svc.categoryId);

  async function handleDeleteClick() {
    setLoadingCount(true);
    setDeleteOpen(true);
    const count = await getServiceAppointmentCount(svc.id);
    setAppointmentCount(count);
    setLoadingCount(false);
  }

  async function handleDelete() {
    setDeleting(true);
    await deleteService(svc.id, appointmentCount > 0);
    setDeleteOpen(false);
    setDeleting(false);
    router.refresh();
  }

  const priceDisplay = svc.price
    ? `${svc.price}`
    : svc.paymentMode === "FREE"
      ? t("common.free")
      : svc.paymentMode === "CONTACT_FOR_PRICE"
        ? t("common.contact")
        : t("svc.pay_on_site");

  return (
    <>
      <Card className="transition-colors hover:bg-muted/30">
        <CardContent className="flex items-center gap-4 py-3">
          {svc.imageUrl ? (
            <img
              src={svc.imageUrl}
              alt={svc.title}
              className="size-14 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Scissors className="size-5 text-muted-foreground" />
            </div>
          )}

          <Link
            href={`/dashboard/services/${svc.id}`}
            className="flex-1 space-y-1"
          >
            <div className="flex items-center gap-2">
              <p className="font-medium hover:underline">{svc.title}</p>
              {!svc.isActive && (
                <Badge variant="secondary" className="text-xs">{t("common.inactive")}</Badge>
              )}
              {category && (
                <Badge variant="outline" className="text-xs">{category.name}</Badge>
              )}
            </div>
            {svc.description && (
              <p className="line-clamp-1 text-sm text-muted-foreground">
                {svc.description}
              </p>
            )}
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {svc.durationMinutes} {t("common.min")}
              </span>
              <span className="font-medium text-foreground">{priceDisplay}</span>
              <Badge variant="secondary" className="text-xs">
                {t(PAYMENT_MODE_LABEL_KEY[svc.paymentMode])}
              </Badge>
            </div>
            {linkedStaff.length > 0 && (
              <div className="flex items-center gap-1.5 pt-0.5">
                <div className="flex -space-x-2 rtl:space-x-reverse">
                  {linkedStaff.slice(0, 4).map((s) =>
                    s.imageUrl ? (
                      <img key={s.id} src={s.imageUrl} alt={s.name} className="size-6 rounded-full border-2 border-white object-cover" />
                    ) : (
                      <div key={s.id} className="flex size-6 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-[10px] font-bold text-gray-500">
                        {s.name.charAt(0)}
                      </div>
                    )
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {t("svc.staff_linked_count", { count: String(linkedStaff.length) })}
                </span>
              </div>
            )}
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="sm" className="size-8 shrink-0 p-0" />}
            >
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/dashboard/services/${svc.id}`)}>
                <Pencil className="me-2 size-4" />
                {t("common.edit")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStaffOpen(true)}>
                <Users className="me-2 size-4" />
                {t("svc.link_staff")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={handleDeleteClick}
              >
                <Trash2 className="me-2 size-4" />
                {t("common.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("svc.delete_title")}</DialogTitle>
            <DialogDescription>
              {t("svc.delete_confirm", { title: svc.title })}
            </DialogDescription>
          </DialogHeader>

          {loadingCount ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : appointmentCount > 0 ? (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
              <p className="text-sm text-amber-800">
                {t("svc.delete_has_appointments" as Parameters<typeof t>[0], { count: String(appointmentCount) })}
              </p>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting || loadingCount}>
              {deleting && <Loader2 className="me-2 size-4 animate-spin" />}
              {appointmentCount > 0
                ? t("svc.delete_confirm_with_appointments" as Parameters<typeof t>[0], { count: String(appointmentCount) })
                : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={staffOpen} onOpenChange={setStaffOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("svc.link_staff_title")}</DialogTitle>
            <DialogDescription>{svc.title}</DialogDescription>
          </DialogHeader>
          <ServiceStaffEditor
            serviceId={svc.id}
            serviceName={svc.title}
            staff={staff}
            linkedStaffIds={linkedStaffIds}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
