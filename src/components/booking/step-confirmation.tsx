"use client";

import { Check, Calendar, Clock, User, Sparkles } from "lucide-react";
import Link from "next/link";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { ReviewForm } from "@/components/reviews/review-form";

interface StepConfirmationProps {
  appointmentId: string;
  businessId: string;
  serviceId: string;
  businessName: string;
  serviceName: string;
  staffName: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  primaryColor: string;
  secondaryColor: string;
}

export function StepConfirmation({
  appointmentId,
  businessId,
  serviceId,
  businessName,
  serviceName,
  staffName,
  date,
  startTime,
  durationMinutes,
  primaryColor,
  secondaryColor,
}: StepConfirmationProps) {
  const t = useT();
  const locale = useLocale();
  const dateLocale = locale === "he" ? "he-IL" : "en-US";
  const startDate = new Date(startTime);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
  const dateDisplay = startDate.toLocaleDateString(dateLocale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const fmt = (d: Date) =>
    d.toLocaleTimeString(dateLocale, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: dateLocale === "en-US",
    });
  const timeDisplay = `${fmt(startDate)} – ${fmt(endDate)}`;

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-4 text-center">
      {/* Success icon */}
      <div className="relative">
        <div
          className="flex size-16 items-center justify-center rounded-full"
          style={{ backgroundColor: `${secondaryColor}15` }}
        >
          <div
            className="flex size-11 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: secondaryColor }}
          >
            <Check className="size-6" strokeWidth={3} />
          </div>
        </div>
        <div
          className="absolute -end-1 -top-1 flex size-6 items-center justify-center rounded-full text-white shadow-sm"
          style={{ backgroundColor: secondaryColor }}
        >
          <Sparkles className="size-3" />
        </div>
      </div>

      <h2 className="mt-5 text-xl font-bold text-gray-900">
        {t("book.all_set")}
      </h2>
      <p className="mt-1.5 max-w-xs text-sm text-gray-400">
        {t("book.confirmed_at", { name: businessName })}
      </p>

      {/* Booking card */}
      <div className="mt-6 w-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="space-y-0 divide-y divide-gray-50 p-4">
          <ConfirmRow
            icon={<Check className="size-4" style={{ color: secondaryColor }} />}
            text={serviceName}
            bold
          />
          <ConfirmRow
            icon={<User className="size-4 text-gray-400" />}
            text={staffName}
          />
          <ConfirmRow
            icon={<Calendar className="size-4 text-gray-400" />}
            text={dateDisplay}
          />
          <ConfirmRow
            icon={<Clock className="size-4 text-gray-400" />}
            text={timeDisplay}
            dir="ltr"
          />
        </div>
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-2.5 text-center text-[11px] text-gray-400">
          {t("book.confirmation")}{appointmentId.slice(0, 8).toUpperCase()}
        </div>
      </div>

      {/* Review form */}
      <div className="mt-6 w-full">
        <ReviewForm
          businessId={businessId}
          appointmentId={appointmentId}
          serviceId={serviceId}
        />
      </div>

      {/* Back to site */}
      <Link
        href="."
        className="mt-6 inline-flex w-full items-center justify-center rounded-2xl px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl active:scale-[0.98]"
        style={{
          backgroundColor: secondaryColor,
          boxShadow: `0 4px 16px ${secondaryColor}30`,
        }}
      >
        {t("book.back_to_site")}
      </Link>
    </div>
  );
}

function ConfirmRow({
  icon,
  text,
  bold,
  dir,
}: {
  icon: React.ReactNode;
  text: string;
  bold?: boolean;
  dir?: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-gray-50">
        {icon}
      </div>
      <span
        dir={dir}
        className={`text-sm ${bold ? "font-semibold text-gray-900" : "text-gray-600"}`}
      >
        {text}
      </span>
    </div>
  );
}
