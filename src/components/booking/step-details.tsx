"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { createAppointment } from "@/actions/booking";
import { formatPrice } from "@/lib/utils/currencies";
import type { InferSelectModel } from "drizzle-orm";
import type { services, staffMembers } from "@/lib/db/schema";
import { ChevronLeft, Calendar, Clock, Loader2, User, CreditCard } from "lucide-react";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { BookingAuth } from "./booking-auth";

type Service = InferSelectModel<typeof services>;
type StaffMember = InferSelectModel<typeof staffMembers>;

interface StepDetailsProps {
  businessId: string;
  service: Service;
  staff: StaffMember;
  date: string;
  startTime: string;
  notes: string;
  currency: string;
  secondaryColor: string;
  onNotesChange: (notes: string) => void;
  onConfirm: (appointmentId: string) => void;
  onBack: () => void;
}

export function StepDetails({
  businessId,
  service,
  staff,
  date,
  startTime,
  notes,
  currency,
  secondaryColor,
  onNotesChange,
  onConfirm,
  onBack,
}: StepDetailsProps) {
  const t = useT();
  const locale = useLocale();
  const dateLocale = locale === "he" ? "he-IL" : "en-US";
  const { data: session, update: updateSession } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isLoggedIn = !!session?.user?.id;

  const startDate = new Date(startTime);
  const endDate = new Date(startDate.getTime() + service.durationMinutes * 60_000);
  const dateDisplay = startDate.toLocaleDateString(dateLocale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const timeFmt: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: dateLocale === "en-US",
  };
  const timeDisplay = `${startDate.toLocaleTimeString(dateLocale, timeFmt)} – ${endDate.toLocaleTimeString(dateLocale, timeFmt)}`;
  const priceDisplay = service.price
    ? formatPrice(service.price, currency)
    : service.paymentMode === "FREE"
      ? t("common.free")
      : t("book.pay_on_site");

  async function handleConfirm() {
    if (!session?.user?.id) {
      setError(t("book.login_to_book"));
      return;
    }

    setLoading(true);
    setError("");

    const result = await createAppointment(businessId, session.user.id, {
      serviceId: service.id,
      staffId: staff.id,
      startTime,
      notes,
    });

    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    onConfirm(result.data.appointmentId);
  }

  async function handleAuthenticated() {
    await updateSession();
  }

  return (
    <div className="flex flex-1 flex-col">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 flex items-center gap-1 self-start text-sm text-gray-400 transition-colors hover:text-gray-600"
      >
        <ChevronLeft className="size-4" />
        {t("book.change_time")}
      </button>

      <h2 className="text-lg font-bold text-gray-900">
        {t("book.review_confirm")}
      </h2>
      <p className="mt-1 text-xs text-gray-400">
        {t("book.review_subtitle")}
      </p>

      {/* Summary card */}
      <div className="mt-5 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center gap-3 p-4">
          {service.imageUrl ? (
            <img
              src={service.imageUrl}
              alt={service.title}
              className="size-12 shrink-0 rounded-xl object-cover"
            />
          ) : (
            <div
              className="flex size-12 shrink-0 items-center justify-center rounded-xl text-base font-bold"
              style={{
                backgroundColor: `${secondaryColor}15`,
                color: secondaryColor,
              }}
            >
              {service.title.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900">
              {service.title}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
              <Clock className="size-3" />
              {service.durationMinutes} {t("common.min")}
            </p>
          </div>
          <span
            className="shrink-0 text-sm font-bold"
            style={{ color: secondaryColor }}
          >
            {priceDisplay}
          </span>
        </div>

        <div className="border-t border-gray-50" />

        <div className="space-y-0 divide-y divide-gray-50 px-4">
          <DetailRow
            icon={<User className="size-4 text-gray-400" />}
            label={staff.name}
            sublabel={staff.roleTitle ?? undefined}
          />
          <DetailRow
            icon={<Calendar className="size-4 text-gray-400" />}
            label={dateDisplay}
          />
          <DetailRow
            icon={<Clock className="size-4 text-gray-400" />}
            label={timeDisplay}
            dir="ltr"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="mt-4">
        <label className="mb-1.5 block text-xs font-medium text-gray-500">
          {t("book.notes_optional")}
        </label>
        <textarea
          className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm placeholder:text-gray-300 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-100"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder={t("book.notes_ph")}
          maxLength={500}
          rows={2}
          disabled={loading}
        />
      </div>

      {/* Auth section - shown when not logged in */}
      {!isLoggedIn && (
        <div className="mt-4">
          <BookingAuth
            secondaryColor={secondaryColor}
            onAuthenticated={handleAuthenticated}
          />
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex-1" />

      {/* Confirm button - only when logged in */}
      {isLoggedIn && (
        <button
          type="button"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:shadow-xl active:scale-[0.98] disabled:opacity-50"
          style={{
            backgroundColor: secondaryColor,
            boxShadow: `0 4px 20px ${secondaryColor}30`,
          }}
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <CreditCard className="size-4" />
          )}
          {t("book.confirm_booking")}
        </button>
      )}
    </div>
  );
}

function DetailRow({
  icon,
  label,
  sublabel,
  dir,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  dir?: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gray-50">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-800" dir={dir}>{label}</p>
        {sublabel && (
          <p className="text-[11px] text-gray-400">{sublabel}</p>
        )}
      </div>
    </div>
  );
}
