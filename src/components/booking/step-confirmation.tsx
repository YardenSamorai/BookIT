"use client";

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { Check, Calendar, Clock, User, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
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

  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    const end = Date.now() + 2500;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: [primaryColor, secondaryColor, "#FFD700", "#FF6B6B", "#4ECDC4"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: [primaryColor, secondaryColor, "#FFD700", "#FF6B6B", "#4ECDC4"],
      });

      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, [primaryColor, secondaryColor]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-4 text-center">
      {/* Success icon */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
        className="relative"
      >
        <div
          className="flex size-20 items-center justify-center rounded-full"
          style={{ background: `linear-gradient(135deg, ${secondaryColor}15, ${secondaryColor}25)` }}
        >
          <div
            className="flex size-14 items-center justify-center rounded-full text-white shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${secondaryColor}, ${secondaryColor}dd)`,
              boxShadow: `0 4px 20px ${secondaryColor}40`,
            }}
          >
            <Check className="size-7" strokeWidth={3} />
          </div>
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
          className="absolute -end-1 -top-1 flex size-7 items-center justify-center rounded-full text-white shadow-md"
          style={{
            background: `linear-gradient(135deg, ${secondaryColor}, ${secondaryColor}cc)`,
          }}
        >
          <Sparkles className="size-3.5" />
        </motion.div>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mt-5 text-2xl font-bold text-gray-900"
      >
        {t("book.all_set")}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="mt-1.5 max-w-xs text-sm text-gray-400"
      >
        {t("book.confirmed_at", { name: businessName })}
      </motion.p>

      {/* Booking card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        className="mt-6 w-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
      >
        <div className="space-y-0 divide-y divide-gray-50 p-4">
          <ConfirmRow
            icon={<Check className="size-4" style={{ color: secondaryColor }} />}
            text={serviceName}
            bold
            color={secondaryColor}
          />
          <ConfirmRow
            icon={<User className="size-4 text-gray-400" />}
            text={staffName}
            color={secondaryColor}
          />
          <ConfirmRow
            icon={<Calendar className="size-4 text-gray-400" />}
            text={dateDisplay}
            color={secondaryColor}
          />
          <ConfirmRow
            icon={<Clock className="size-4 text-gray-400" />}
            text={timeDisplay}
            dir="ltr"
            color={secondaryColor}
          />
        </div>
        <div className="border-t border-gray-100 bg-gray-50/80 px-4 py-2.5 text-center text-[11px] text-gray-400">
          {t("book.confirmation")}{appointmentId.slice(0, 8).toUpperCase()}
        </div>
      </motion.div>

      {/* Review form */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
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
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-6 w-full"
      >
        <Link
          href="."
          className="inline-flex w-full items-center justify-center rounded-2xl px-6 py-4 text-[15px] font-bold text-white shadow-lg transition-all hover:shadow-xl active:scale-[0.98]"
          style={{
            background: `linear-gradient(135deg, ${secondaryColor}, ${secondaryColor}dd)`,
            boxShadow: `0 4px 20px ${secondaryColor}35`,
          }}
        >
          {t("book.back_to_site")}
        </Link>
      </motion.div>
    </div>
  );
}

function ConfirmRow({
  icon,
  text,
  bold,
  dir,
  color,
}: {
  icon: React.ReactNode;
  text: string;
  bold?: boolean;
  dir?: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div
        className="flex size-8 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}10` }}
      >
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
