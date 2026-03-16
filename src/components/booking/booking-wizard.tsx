"use client";

import { useState, useMemo } from "react";
import { StepStaff } from "./step-staff";
import { StepService } from "./step-service";
import { StepDateTime } from "./step-date-time";
import { StepDetails } from "./step-details";
import { StepConfirmation } from "./step-confirmation";
import { getDir, type Locale } from "@/lib/i18n";
import { LocaleProvider, useT } from "@/lib/i18n/locale-context";
import type { InferSelectModel } from "drizzle-orm";
import type { services, staffMembers } from "@/lib/db/schema";

type Service = InferSelectModel<typeof services>;
type StaffMember = InferSelectModel<typeof staffMembers>;

interface BookingWizardProps {
  businessId: string;
  businessName: string;
  services: Service[];
  staff: StaffMember[];
  staffServiceMap: Record<string, string[]>;
  serviceStaffMap: Record<string, string[]>;
  primaryColor: string;
  secondaryColor: string;
  currency: string;
  locale: Locale;
  initialServiceId?: string;
}

export interface BookingState {
  staffId: string;
  serviceId: string;
  date: string;
  startTime: string;
  notes: string;
}

const STEP_KEYS = [
  "book.step_service",
  "book.step_professional",
  "book.step_datetime",
  "book.step_confirm",
] as const;

export function BookingWizard(props: BookingWizardProps) {
  return (
    <LocaleProvider locale={props.locale}>
      <BookingWizardInner {...props} />
    </LocaleProvider>
  );
}

function BookingWizardInner({
  businessId,
  businessName,
  services: serviceList,
  staff,
  staffServiceMap,
  serviceStaffMap,
  primaryColor,
  secondaryColor,
  currency,
  locale,
  initialServiceId,
}: BookingWizardProps) {
  const t = useT();
  const [step, setStep] = useState(initialServiceId ? 1 : 0);
  const [booking, setBooking] = useState<BookingState>({
    serviceId: initialServiceId ?? "",
    staffId: "",
    date: "",
    startTime: "",
    notes: "",
  });
  const [appointmentId, setAppointmentId] = useState("");

  function update(patch: Partial<BookingState>) {
    setBooking((prev) => ({ ...prev, ...patch }));
  }

  function next() {
    setStep((s) => Math.min(s + 1, 4));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  const selectedStaff = staff.find((s) => s.id === booking.staffId);
  const selectedService = serviceList.find((s) => s.id === booking.serviceId);

  const staffForService = useMemo(() => {
    if (!booking.serviceId) return staff;
    const serviceStaff = serviceStaffMap[booking.serviceId];
    if (!serviceStaff || serviceStaff.length === 0) return staff;
    const set = new Set(serviceStaff);
    return staff.filter((s) => set.has(s.id));
  }, [booking.serviceId, serviceStaffMap, staff]);

  const isConfirmed = step === 4;

  return (
    <div dir={getDir(locale)} className="flex flex-1 flex-col">
      {/* Step indicator */}
      {!isConfirmed && (
        <div className="mb-6 flex items-center justify-between">
          <p className="text-xs font-medium text-gray-400">
            {t(STEP_KEYS[step] as Parameters<typeof t>[0])}
          </p>
          <div className="flex items-center gap-1.5">
            {STEP_KEYS.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === step ? "h-2 w-5" : "size-2"
                }`}
                style={{
                  backgroundColor: i <= step ? secondaryColor : "#e5e7eb",
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step 0: Service */}
      {step === 0 && (
        <StepService
          services={serviceList}
          selectedId={booking.serviceId}
          currency={currency}
          secondaryColor={secondaryColor}
          onSelect={(id) => {
            update({ serviceId: id, staffId: "", date: "", startTime: "" });
            next();
          }}
        />
      )}

      {/* Step 1: Staff (filtered by service) */}
      {step === 1 && (
        <StepStaff
          staff={staffForService}
          selectedId={booking.staffId}
          secondaryColor={secondaryColor}
          serviceName={selectedService?.title}
          serviceImage={selectedService?.imageUrl}
          onSelect={(id) => {
            update({ staffId: id, date: "", startTime: "" });
            next();
          }}
          onBack={back}
        />
      )}

      {/* Step 2: Date & Time */}
      {step === 2 && selectedService && (
        <StepDateTime
          businessId={businessId}
          serviceId={booking.serviceId}
          staffId={booking.staffId}
          selectedDate={booking.date}
          selectedTime={booking.startTime}
          secondaryColor={secondaryColor}
          durationMin={selectedService.durationMinutes}
          staffName={selectedStaff?.name}
          staffImage={selectedStaff?.imageUrl}
          onSelect={(date, startTime) => {
            update({ date, startTime });
            next();
          }}
          onBack={back}
        />
      )}

      {/* Step 3: Details & Confirm */}
      {step === 3 && selectedService && selectedStaff && (
        <StepDetails
          businessId={businessId}
          service={selectedService}
          staff={selectedStaff}
          date={booking.date}
          startTime={booking.startTime}
          notes={booking.notes}
          currency={currency}
          secondaryColor={secondaryColor}
          onNotesChange={(notes) => update({ notes })}
          onConfirm={(id) => {
            setAppointmentId(id);
            next();
          }}
          onBack={back}
        />
      )}

      {/* Step 4: Confirmed */}
      {step === 4 && (
        <StepConfirmation
          appointmentId={appointmentId}
          businessId={businessId}
          serviceId={booking.serviceId}
          businessName={businessName}
          serviceName={selectedService?.title ?? ""}
          staffName={selectedStaff?.name ?? ""}
          date={booking.date}
          startTime={booking.startTime}
          durationMinutes={selectedService?.durationMinutes ?? 60}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
        />
      )}
    </div>
  );
}
