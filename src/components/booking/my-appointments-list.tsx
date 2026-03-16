"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cancelAppointment } from "@/actions/booking";
import { Calendar, Clock, Loader2, User, XCircle } from "lucide-react";
import { useT, useLocale } from "@/lib/i18n/locale-context";

interface Appointment {
  id: string;
  startTime: Date;
  endTime: Date;
  status: string;
  paymentStatus: string;
  notes: string | null;
  serviceName: string;
  serviceDuration: number;
  staffName: string;
  businessName: string;
  businessSlug: string;
}

interface MyAppointmentsListProps {
  appointments: Appointment[];
  secondaryColor: string;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  CONFIRMED: "default",
  PENDING: "outline",
  CANCELLED: "destructive",
  COMPLETED: "secondary",
  NO_SHOW: "destructive",
};

export function MyAppointmentsList({
  appointments,
  secondaryColor,
}: MyAppointmentsListProps) {
  const t = useT();

  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <Calendar className="size-10 text-gray-300" />
        <p className="mt-3 font-medium text-gray-500">{t("myapt.no_appointments")}</p>
        <p className="text-sm text-gray-400">{t("myapt.no_appointments_desc")}</p>
      </div>
    );
  }

  const upcoming = appointments.filter(
    (a) => new Date(a.startTime) > new Date() && a.status !== "CANCELLED"
  );
  const past = appointments.filter(
    (a) => new Date(a.startTime) <= new Date() || a.status === "CANCELLED"
  );

  return (
    <div className="space-y-8">
      {upcoming.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
            {t("myapt.upcoming")}
          </h3>
          <div className="space-y-3">
            {upcoming.map((apt) => (
              <AppointmentCard
                key={apt.id}
                appointment={apt}
                secondaryColor={secondaryColor}
                canCancel
              />
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
            {t("myapt.past")}
          </h3>
          <div className="space-y-3">
            {past.map((apt) => (
              <AppointmentCard
                key={apt.id}
                appointment={apt}
                secondaryColor={secondaryColor}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AppointmentCard({
  appointment: apt,
  secondaryColor,
  canCancel,
}: {
  appointment: Appointment;
  secondaryColor: string;
  canCancel?: boolean;
}) {
  const t = useT();
  const locale = useLocale();
  const dateLocale = locale === "he" ? "he-IL" : "en-US";
  const router = useRouter();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const startDate = new Date(apt.startTime);
  const dateDisplay = startDate.toLocaleDateString(dateLocale, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeDisplay = startDate.toLocaleTimeString(dateLocale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: dateLocale === "en-US",
  });

  async function handleCancel() {
    setCancelling(true);
    await cancelAppointment(apt.id, "CUSTOMER");
    setCancelOpen(false);
    setCancelling(false);
    router.refresh();
  }

  return (
    <>
      <div className="rounded-xl border bg-white p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900">{apt.serviceName}</p>
              <Badge variant={STATUS_VARIANT[apt.status] ?? "secondary"}>
                {apt.status}
              </Badge>
            </div>
            <div className="space-y-1 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <User className="size-3.5" />
                {apt.staffName}
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                {dateDisplay}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="size-3.5" />
                {timeDisplay} · {apt.serviceDuration} {t("common.min")}
              </div>
            </div>
          </div>

          {canCancel && apt.status !== "CANCELLED" && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setCancelOpen(true)}
            >
              <XCircle className="mr-1 size-4" />
              {t("common.cancel")}
            </Button>
          )}
        </div>
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("myapt.cancel_title")}</DialogTitle>
            <DialogDescription>
              {t("myapt.cancel_confirm", { service: apt.serviceName, date: dateDisplay, time: timeDisplay })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)} disabled={cancelling}>
              {t("myapt.keep")}
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelling}>
              {cancelling && <Loader2 className="mr-2 size-4 animate-spin" />}
              {t("myapt.cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
