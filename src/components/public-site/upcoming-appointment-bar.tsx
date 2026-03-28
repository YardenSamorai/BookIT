"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { CalendarCheck, X, ChevronRight } from "lucide-react";
import { BUSINESS_TZ } from "@/lib/tz";
import { t, type Locale } from "@/lib/i18n";

interface UpcomingAppointmentBarProps {
  businessId: string;
  myAppointmentsUrl: string;
  secondaryColor: string;
  locale: Locale;
}

interface NextAppointment {
  id: string;
  startTime: string;
  endTime: string;
  serviceName: string;
  staffName: string;
}

export function UpcomingAppointmentBar({
  businessId,
  myAppointmentsUrl,
  secondaryColor,
  locale,
}: UpcomingAppointmentBarProps) {
  const { data: session } = useSession();
  const [appointment, setAppointment] = useState<NextAppointment | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!session?.user?.id || dismissed) return;

    const key = `apt-bar-dismissed-${businessId}`;
    if (sessionStorage.getItem(key)) {
      setDismissed(true);
      return;
    }

    fetch(`/api/next-appointment?businessId=${businessId}`)
      .then((res) => res.json())
      .then((data) => {
        setAppointment(data.appointment ?? null);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [session?.user?.id, businessId, dismissed]);

  function handleDismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem(`apt-bar-dismissed-${businessId}`, "1");
    } catch { /* SSR safety */ }
  }

  if (!loaded || !appointment || dismissed) return null;

  const dtLocale = locale === "he" ? "he-IL" : "en-US";
  const start = new Date(appointment.startTime);

  const dateStr = start.toLocaleDateString(dtLocale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: BUSINESS_TZ,
  });

  const timeStr = start.toLocaleTimeString(dtLocale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: BUSINESS_TZ,
  });

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-50 animate-in slide-in-from-bottom-full duration-500"
      style={{ direction: locale === "he" ? "rtl" : "ltr" }}
    >
      <div className="mx-auto max-w-xl px-3 pb-3">
        <div
          className="relative flex items-center gap-3 rounded-2xl px-4 py-3 shadow-xl border backdrop-blur-sm"
          style={{
            backgroundColor: `color-mix(in srgb, ${secondaryColor} 8%, white 92%)`,
            borderColor: `color-mix(in srgb, ${secondaryColor} 20%, transparent 80%)`,
          }}
        >
          {/* Icon */}
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `color-mix(in srgb, ${secondaryColor} 15%, white 85%)` }}
          >
            <CalendarCheck className="size-5" style={{ color: secondaryColor }} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-500">
              {t(locale, "pub.next_apt")}
            </p>
            <p className="text-sm font-semibold text-gray-900 truncate">
              {dateStr} · {timeStr}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {appointment.serviceName} · {appointment.staffName}
            </p>
          </div>

          {/* View button */}
          <a
            href={myAppointmentsUrl}
            className="flex items-center gap-1 shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: secondaryColor }}
          >
            {t(locale, "pub.next_apt_view")}
            <ChevronRight className="size-3.5 rtl:rotate-180" />
          </a>

          {/* Dismiss */}
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute -top-2 -end-2 flex size-6 items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
