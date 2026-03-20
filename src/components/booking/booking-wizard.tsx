"use client";

import { useState, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Dumbbell } from "lucide-react";
import { StepStaff } from "./step-staff";
import { StepService } from "./step-service";
import { StepDateTime } from "./step-date-time";
import { StepDetails } from "./step-details";
import { StepConfirmation } from "./step-confirmation";
import { WorkoutBookingView } from "./workout-booking-view";
import { getDir, type Locale } from "@/lib/i18n";
import { LocaleProvider, useT } from "@/lib/i18n/locale-context";
import type { InferSelectModel } from "drizzle-orm";
import type { services, staffMembers } from "@/lib/db/schema";

type Service = InferSelectModel<typeof services>;
type StaffMember = InferSelectModel<typeof staffMembers>;

type BookingMode = "appointment" | "workout";

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
  hasWorkouts?: boolean;
  hasRegularServices?: boolean;
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

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -80 : 80,
    opacity: 0,
  }),
};

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
  hasWorkouts,
  hasRegularServices = true,
}: BookingWizardProps) {
  const t = useT();
  const dir = getDir(locale);

  const workoutsOnly = hasWorkouts && !hasRegularServices;
  const showToggle = hasWorkouts && hasRegularServices;

  const [mode, setMode] = useState<BookingMode>(workoutsOnly ? "workout" : "appointment");
  const [step, setStep] = useState(initialServiceId ? 1 : 0);
  const [booking, setBooking] = useState<BookingState>({
    serviceId: initialServiceId ?? "",
    staffId: "",
    date: "",
    startTime: "",
    notes: "",
  });
  const [appointmentId, setAppointmentId] = useState("");
  const slideDir = useRef(1);

  function update(patch: Partial<BookingState>) {
    setBooking((prev) => ({ ...prev, ...patch }));
  }

  function next() {
    slideDir.current = dir === "rtl" ? -1 : 1;
    setStep((s) => Math.min(s + 1, 4));
  }

  function back() {
    slideDir.current = dir === "rtl" ? 1 : -1;
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

  const progress = isConfirmed ? 100 : ((step + 1) / STEP_KEYS.length) * 100;

  return (
    <div dir={dir} className="flex flex-1 flex-col">
      {/* Mode toggle - shown only when business has both workouts and regular services */}
      {showToggle && (mode === "workout" || step === 0) && (
        <div className="mb-5">
          <div className="flex gap-1.5 rounded-xl bg-gray-100 p-1">
            <button
              onClick={() => setMode("appointment")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all ${
                mode === "appointment"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Calendar size={14} />
              {t("book.mode_appointment" as Parameters<typeof t>[0])}
            </button>
            <button
              onClick={() => setMode("workout")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all ${
                mode === "workout"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Dumbbell size={14} />
              {t("book.mode_workout" as Parameters<typeof t>[0])}
            </button>
          </div>
        </div>
      )}

      {/* Workout mode */}
      {mode === "workout" ? (
        <WorkoutBookingView
          businessId={businessId}
          businessName={businessName}
          secondaryColor={secondaryColor}
          primaryColor={primaryColor}
        />
      ) : (
        <>
          {!isConfirmed && (
            <div className="mb-6">
              <div className="mb-3 flex items-center justify-between">
                {STEP_KEYS.map((key, i) => {
                  const isActive = i === step;
                  const isDone = i < step;
                  return (
                    <div key={key} className="flex flex-1 flex-col items-center gap-1.5">
                      <div
                        className="flex size-7 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-300"
                        style={
                          isActive
                            ? { backgroundColor: secondaryColor, color: "#fff" }
                            : isDone
                              ? { backgroundColor: `${secondaryColor}20`, color: secondaryColor }
                              : { backgroundColor: "#f3f4f6", color: "#9ca3af" }
                        }
                      >
                        {isDone ? "✓" : i + 1}
                      </div>
                      <span
                        className="text-[10px] font-medium transition-colors duration-300"
                        style={{ color: isActive ? secondaryColor : isDone ? secondaryColor : "#9ca3af" }}
                      >
                        {t(key as Parameters<typeof t>[0])}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="relative h-1 overflow-hidden rounded-full bg-gray-100">
                <motion.div
                  className="absolute inset-y-0 start-0 rounded-full"
                  style={{ backgroundColor: secondaryColor }}
                  initial={false}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                />
              </div>
            </div>
          )}

          <AnimatePresence mode="wait" custom={slideDir.current}>
            <motion.div
              key={step}
              custom={slideDir.current}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="flex flex-1 flex-col"
            >
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
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
