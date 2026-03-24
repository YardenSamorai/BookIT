"use client";

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { Calendar, Clock, User, Sparkles, CircleCheck } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { BUSINESS_TZ } from "@/lib/tz";
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
    timeZone: BUSINESS_TZ,
  });
  const fmt = (d: Date) =>
    d.toLocaleTimeString(dateLocale, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: dateLocale === "en-US",
      timeZone: BUSINESS_TZ,
    });
  const timeDisplay = `${fmt(startDate)} – ${fmt(endDate)}`;

  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    confetti({
      particleCount: 60,
      spread: 65,
      origin: { y: 0.55 },
      colors: [primaryColor, secondaryColor, "#fbbf24", "#34d399"],
      gravity: 1.3,
      ticks: 120,
    });
  }, [primaryColor, secondaryColor]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-6 text-center sm:py-10">
      {/* Success icon */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 14, delay: 0.1 }}
        className="relative"
      >
        <div
          className="flex size-[72px] items-center justify-center rounded-full sm:size-20"
          style={{
            background: `linear-gradient(135deg, ${secondaryColor}18, ${secondaryColor}08)`,
          }}
        >
          <div
            className="flex size-12 items-center justify-center rounded-full text-white sm:size-14"
            style={{
              background: `linear-gradient(135deg, ${secondaryColor}, ${secondaryColor}dd)`,
              boxShadow: `0 8px 24px ${secondaryColor}30`,
            }}
          >
            <CircleCheck className="size-6 sm:size-7" />
          </div>
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
          className="absolute -end-1 -top-1 flex size-7 items-center justify-center rounded-full bg-white shadow-sm"
        >
          <Sparkles className="size-4" style={{ color: secondaryColor }} />
        </motion.div>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.35 }}
        className="mt-6 text-xl font-bold text-gray-900 sm:text-2xl"
      >
        {t("book.all_set")}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.35 }}
        className="mt-1.5 max-w-xs text-sm text-gray-500"
      >
        {t("book.confirmed_at", { name: businessName })}
      </motion.p>

      {/* Booking card */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.35 }}
        className="mt-6 w-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
      >
        <div
          className="h-0.5"
          style={{ background: `linear-gradient(90deg, ${secondaryColor}, ${primaryColor})` }}
        />
        <div className="p-4 sm:p-5">
          <p className="mb-3 text-sm font-bold text-gray-900 sm:text-[15px]">
            {serviceName}
          </p>
          <div className="space-y-2.5">
            <SummaryRow icon={<User size={14} />} color={secondaryColor}>
              {staffName}
            </SummaryRow>
            <SummaryRow icon={<Calendar size={14} />} color={secondaryColor}>
              {dateDisplay}
            </SummaryRow>
            <SummaryRow icon={<Clock size={14} />} color={secondaryColor} dir="ltr">
              {timeDisplay}
            </SummaryRow>
          </div>
        </div>
        <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-2.5 text-center text-[11px] text-gray-400">
          {t("book.confirmation")}
          {appointmentId.slice(0, 8).toUpperCase()}
        </div>
      </motion.div>

      {/* Review form */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
        className="mt-6 w-full"
      >
        <ReviewForm
          businessId={businessId}
          appointmentId={appointmentId}
          serviceId={serviceId}
        />
      </motion.div>

      {/* Back to site */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
        className="mt-6 w-full"
      >
        <Link
          href="."
          className="inline-flex w-full items-center justify-center rounded-xl px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl active:scale-[0.98]"
          style={{
            backgroundColor: secondaryColor,
            boxShadow: `0 4px 14px ${secondaryColor}30`,
          }}
        >
          {t("book.back_to_site")}
        </Link>
      </motion.div>
    </div>
  );
}

function SummaryRow({
  icon,
  color,
  dir,
  children,
}: {
  icon: React.ReactNode;
  color: string;
  dir?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-gray-500" dir={dir}>
      <div
        className="flex size-7 shrink-0 items-center justify-center rounded-md"
        style={{ backgroundColor: `${color}08` }}
      >
        <span style={{ color: `${color}90` }}>{icon}</span>
      </div>
      <span>{children}</span>
    </div>
  );
}
