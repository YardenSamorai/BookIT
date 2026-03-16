"use client";

import { useRouter } from "next/navigation";
import { BookingAuth } from "./booking-auth";
import { MyAppointmentsList } from "./my-appointments-list";
import { useT } from "@/lib/i18n/locale-context";
import { CalendarCheck } from "lucide-react";

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

interface MyAppointmentsGateProps {
  isAuthenticated: boolean;
  appointments: Appointment[];
  secondaryColor: string;
}

export function MyAppointmentsGate({
  isAuthenticated,
  appointments,
  secondaryColor,
}: MyAppointmentsGateProps) {
  const t = useT();
  const router = useRouter();

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center py-8">
        <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-gray-100">
          <CalendarCheck className="size-7 text-gray-400" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">
          {t("myapt.login_title")}
        </h2>
        <p className="mt-1 mb-6 text-center text-sm text-gray-500">
          {t("myapt.login_desc")}
        </p>
        <div className="w-full max-w-sm">
          <BookingAuth
            secondaryColor={secondaryColor}
            onAuthenticated={() => router.refresh()}
          />
        </div>
      </div>
    );
  }

  return (
    <MyAppointmentsList
      appointments={appointments}
      secondaryColor={secondaryColor}
    />
  );
}
