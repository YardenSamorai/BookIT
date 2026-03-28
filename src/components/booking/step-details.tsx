"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { createAppointment } from "@/actions/booking";
import { formatPrice } from "@/lib/utils/currencies";
import type { InferSelectModel } from "drizzle-orm";
import type { services, staffMembers } from "@/lib/db/schema";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Loader2,
  User,
  CreditCard,
  CheckCircle2,
  MessageSquare,
  Info,
} from "lucide-react";
import { motion } from "framer-motion";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { BookingAuth } from "./booking-auth";
import { BUSINESS_TZ } from "@/lib/tz";

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
  const [activeCard, setActiveCard] = useState<{
    sessionsRemaining: number;
    sessionsTotal: number;
    name: string;
  } | null>(null);

  const isLoggedIn = !!session?.user?.id;

  useEffect(() => {
    if (!isLoggedIn) return;

    fetch(`/api/cards/check?businessId=${businessId}&serviceId=${service.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.cards?.length > 0) {
          const card = data.cards[0];
          setActiveCard({
            sessionsRemaining: card.sessionsRemaining,
            sessionsTotal: card.sessionsTotal,
            name: card.name,
          });
        } else {
          fetch(
            `/api/check-package?businessId=${businessId}&serviceId=${service.id}`
          )
            .then((r) => r.json())
            .then((data) => {
              if (data.hasPackage) {
                setActiveCard({
                  sessionsRemaining: data.sessionsRemaining,
                  sessionsTotal: data.sessionsRemaining,
                  name: data.packageName,
                });
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, [isLoggedIn, businessId, service.id]);

  const startDate = new Date(startTime);
  const endDate = new Date(
    startDate.getTime() + service.durationMinutes * 60_000
  );
  const dateDisplay = startDate.toLocaleDateString(dateLocale, {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: BUSINESS_TZ,
  });
  const timeFmt: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: dateLocale === "en-US",
    timeZone: BUSINESS_TZ,
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
      setError(result.error === "CUSTOMER_BLOCKED" ? "CUSTOMER_BLOCKED" : result.error);
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
        className="mb-4 flex items-center gap-1.5 self-start text-sm text-gray-400 transition-colors hover:text-gray-600"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {t("book.change_time")}
      </button>

      <h2 className="text-xl font-bold tracking-tight text-gray-900">
        {t("book.review_confirm")}
      </h2>
      <p className="mt-1 text-sm text-gray-400">{t("book.review_subtitle")}</p>

      {/* Summary card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mt-5 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
      >
        {/* Branded accent */}
        <div
          className="h-0.5"
          style={{
            background: `linear-gradient(90deg, ${secondaryColor}, ${secondaryColor}80)`,
          }}
        />

        {/* Service header */}
        <div className="flex items-center gap-3.5 p-4">
          {service.imageUrl ? (
            <img
              src={service.imageUrl}
              alt={service.title}
              className="size-14 shrink-0 rounded-xl object-cover ring-1 ring-black/5"
            />
          ) : (
            <div
              className="flex size-14 shrink-0 items-center justify-center rounded-xl text-lg font-bold"
              style={{
                background: `linear-gradient(135deg, ${secondaryColor}12, ${secondaryColor}25)`,
                color: secondaryColor,
              }}
            >
              {service.title.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-gray-900">
              {service.title}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-[13px] text-gray-400">
              <Clock className="size-3" />
              {service.durationMinutes} {t("common.min")}
            </p>
          </div>
          <span
            className="shrink-0 text-[15px] font-bold"
            style={{ color: secondaryColor }}
          >
            {priceDisplay}
          </span>
        </div>

        <div className="mx-4 border-t border-gray-50" />

        {/* Detail rows */}
        <div className="space-y-0 px-4">
          <DetailRow
            icon={<User className="size-4" />}
            label={staff.name}
            sublabel={staff.roleTitle ?? undefined}
            color={secondaryColor}
          />
          <DetailRow
            icon={<Calendar className="size-4" />}
            label={dateDisplay}
            color={secondaryColor}
          />
          <DetailRow
            icon={<Clock className="size-4" />}
            label={timeDisplay}
            dir="ltr"
            color={secondaryColor}
          />
        </div>
      </motion.div>

      {/* Active card banner */}
      {activeCard && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-3 space-y-1.5 rounded-xl border border-green-200 bg-green-50 px-3.5 py-2.5"
        >
          <div className="flex items-center gap-2.5">
            <CreditCard className="size-4 shrink-0 text-green-600" />
            <p className="text-xs font-medium text-green-800">
              {t("card.will_deduct", { name: activeCard.name })}
            </p>
          </div>
          <p className="text-[11px] text-green-700 ps-6.5">
            {t("card.remaining_after", {
              n: String(activeCard.sessionsRemaining - 1),
              total: String(activeCard.sessionsTotal),
            })}
          </p>
        </motion.div>
      )}

      {/* Notes */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="mt-4"
      >
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-500">
          <MessageSquare className="size-3" />
          {t("book.notes_optional")}
        </label>
        <textarea
          className="w-full rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm shadow-sm transition-all placeholder:text-gray-300 focus:border-gray-200 focus:shadow-[0_2px_8px_rgba(0,0,0,0.06)] focus:outline-none"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder={t("book.notes_ph")}
          maxLength={500}
          rows={2}
          disabled={loading}
        />
      </motion.div>

      {/* Auth */}
      {!isLoggedIn && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="mt-4"
        >
          <BookingAuth
            secondaryColor={secondaryColor}
            onAuthenticated={handleAuthenticated}
          />
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-3 rounded-xl border p-3 text-sm flex items-start gap-2.5 ${
            error === "CUSTOMER_BLOCKED"
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : "border-red-100 bg-red-50 text-red-700"
          }`}
        >
          {error === "CUSTOMER_BLOCKED" && <Info className="size-4 mt-0.5 shrink-0" />}
          <span>{error === "CUSTOMER_BLOCKED" ? t("booking.blocked_message") : error}</span>
        </motion.div>
      )}

      <div className="flex-1" />

      {/* Confirm button */}
      {isLoggedIn && (
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          type="button"
          className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:shadow-xl active:scale-[0.98] disabled:opacity-50"
          style={{
            backgroundColor: secondaryColor,
            boxShadow: `0 4px 14px ${secondaryColor}30`,
          }}
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <CheckCircle2 className="size-5" />
          )}
          {t("book.confirm_booking")}
        </motion.button>
      )}
    </div>
  );
}

function DetailRow({
  icon,
  label,
  sublabel,
  dir,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  dir?: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-lg"
        style={{
          backgroundColor: `${color}10`,
          color: color,
        }}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-800" dir={dir}>
          {label}
        </p>
        {sublabel && <p className="text-[11px] text-gray-400">{sublabel}</p>}
      </div>
    </div>
  );
}
