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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cancelAppointment } from "@/actions/booking";
import { RescheduleDialog } from "./reschedule-dialog";
import { Calendar, Clock, Loader2, User, XCircle, RefreshCw } from "lucide-react";
import { useT, useLocale } from "@/lib/i18n/locale-context";

interface Appointment {
  id: string;
  startTime: Date;
  endTime: Date;
  status: string;
  paymentStatus: string;
  notes: string | null;
  serviceId: string;
  serviceName: string;
  serviceDuration: number;
  staffId: string;
  staffName: string;
  businessId: string;
  businessName: string;
  businessSlug: string;
}

interface AccountPageClientProps {
  appointments: Appointment[];
  businessId: string;
  secondaryColor: string;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  CONFIRMED: "default",
  PENDING: "outline",
  CANCELLED: "destructive",
  COMPLETED: "secondary",
  NO_SHOW: "destructive",
};

export function AccountPageClient({
  appointments,
  businessId,
  secondaryColor,
}: AccountPageClientProps) {
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
    <Tabs defaultValue="upcoming">
      <TabsList>
        <TabsTrigger value="upcoming">
          {t("myapt.upcoming")} {upcoming.length > 0 && `(${upcoming.length})`}
        </TabsTrigger>
        <TabsTrigger value="past">
          {t("myapt.past")} {past.length > 0 && `(${past.length})`}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="upcoming">
        {upcoming.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">
            {t("myapt.no_appointments")}
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((apt) => (
              <AppointmentCard
                key={apt.id}
                appointment={apt}
                businessId={businessId}
                secondaryColor={secondaryColor}
                canCancel
                canReschedule
              />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="past">
        {past.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">
            {t("myapt.no_appointments")}
          </div>
        ) : (
          <div className="space-y-3">
            {past.map((apt) => (
              <AppointmentCard
                key={apt.id}
                appointment={apt}
                businessId={businessId}
                secondaryColor={secondaryColor}
              />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

function AppointmentCard({
  appointment: apt,
  businessId,
  secondaryColor,
  canCancel,
  canReschedule,
}: {
  appointment: Appointment;
  businessId: string;
  secondaryColor: string;
  canCancel?: boolean;
  canReschedule?: boolean;
}) {
  const t = useT();
  const locale = useLocale();
  const dateLocale = locale === "he" ? "he-IL" : "en-US";
  const router = useRouter();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const startDate = new Date(apt.startTime);
  const endDate = new Date(apt.endTime);
  const dateDisplay = startDate.toLocaleDateString(dateLocale, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeStart = startDate.toLocaleTimeString(dateLocale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: dateLocale === "en-US",
  });
  const timeEnd = endDate.toLocaleTimeString(dateLocale, {
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
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-gray-900">{apt.serviceName}</p>
              <Badge variant={STATUS_VARIANT[apt.status] ?? "secondary"}>
                {apt.status}
              </Badge>
            </div>
            <div className="space-y-1 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <User className="size-3.5 shrink-0" />
                {apt.staffName}
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="size-3.5 shrink-0" />
                {dateDisplay}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="size-3.5 shrink-0" />
                {timeStart} – {timeEnd}
              </div>
            </div>
          </div>

          {canCancel && apt.status !== "CANCELLED" && (
            <div className="flex shrink-0 flex-col gap-1.5">
              {canReschedule && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRescheduleOpen(true)}
                >
                  <RefreshCw className="mr-1 size-3.5" />
                  {t("myapt.reschedule")}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setCancelOpen(true)}
              >
                <XCircle className="mr-1 size-3.5" />
                {t("common.cancel")}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Cancel dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("myapt.cancel_title")}</DialogTitle>
            <DialogDescription>
              {t("myapt.cancel_confirm", {
                service: apt.serviceName,
                date: dateDisplay,
                time: timeStart,
              })}
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

      {/* Reschedule dialog */}
      {canReschedule && (
        <RescheduleDialog
          open={rescheduleOpen}
          onOpenChange={setRescheduleOpen}
          appointmentId={apt.id}
          businessId={businessId}
          serviceId={apt.serviceId}
          currentStaffId={apt.staffId}
          secondaryColor={secondaryColor}
        />
      )}
    </>
  );
}
