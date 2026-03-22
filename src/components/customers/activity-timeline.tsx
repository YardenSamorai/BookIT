"use client";

import {
  Calendar,
  CreditCard,
  StickyNote,
  User,
  Tag,
  Shield,
  Clock,
  DollarSign,
} from "lucide-react";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import type { CustomerActivity } from "@/lib/db/queries/customers";

const ACTIVITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  CREATED: User,
  PROFILE_UPDATED: User,
  STATUS_CHANGED: Shield,
  APPOINTMENT_BOOKED: Calendar,
  APPOINTMENT_CANCELLED: Calendar,
  APPOINTMENT_COMPLETED: Calendar,
  APPOINTMENT_NO_SHOW: Calendar,
  CARD_PURCHASED: CreditCard,
  CARD_ACTIVATED: CreditCard,
  CARD_USED: CreditCard,
  CARD_RESTORED: CreditCard,
  CARD_CANCELLED: CreditCard,
  PAYMENT_UPDATED: DollarSign,
  NOTE_ADDED: StickyNote,
  TAG_UPDATED: Tag,
};

const ACTIVITY_COLORS: Record<string, string> = {
  CREATED: "bg-blue-500",
  PROFILE_UPDATED: "bg-blue-400",
  STATUS_CHANGED: "bg-purple-500",
  APPOINTMENT_BOOKED: "bg-green-500",
  APPOINTMENT_CANCELLED: "bg-red-400",
  APPOINTMENT_COMPLETED: "bg-green-600",
  APPOINTMENT_NO_SHOW: "bg-orange-500",
  CARD_PURCHASED: "bg-indigo-500",
  CARD_ACTIVATED: "bg-green-500",
  CARD_USED: "bg-blue-500",
  CARD_RESTORED: "bg-amber-500",
  CARD_CANCELLED: "bg-red-500",
  PAYMENT_UPDATED: "bg-emerald-500",
  NOTE_ADDED: "bg-gray-500",
  TAG_UPDATED: "bg-gray-400",
};

interface Props {
  activities: CustomerActivity[];
  compact?: boolean;
}

export function ActivityTimeline({ activities, compact }: Props) {
  const t = useT();
  const locale = useLocale();

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
        <Clock className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {t("cust.no_appointments")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {activities.map((activity, idx) => {
        const Icon = ACTIVITY_ICONS[activity.type] ?? Clock;
        const dotColor = ACTIVITY_COLORS[activity.type] ?? "bg-gray-400";
        const description = getActivityDescription(activity, t);
        const relTime = getRelativeTime(new Date(activity.createdAt), locale);

        return (
          <div key={activity.id} className="flex gap-3 group">
            <div className="flex flex-col items-center">
              <div className={`size-7 rounded-full flex items-center justify-center ${dotColor} shrink-0`}>
                <Icon className="size-3.5 text-white" />
              </div>
              {idx < activities.length - 1 && (
                <div className="w-px flex-1 bg-border min-h-[16px]" />
              )}
            </div>
            <div className={`pb-4 min-w-0 flex-1 ${compact ? "pb-3" : "pb-4"}`}>
              <p className={`text-sm ${compact ? "text-xs" : ""}`}>{description}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{relTime}</p>
              {!compact && activity.actorName && (
                <p className="text-xs text-muted-foreground">
                  {activity.actorName}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getActivityDescription(
  activity: CustomerActivity,
  t: ReturnType<typeof useT>
): string {
  const meta = (activity.metadata ?? {}) as Record<string, string>;
  const keyMap: Record<string, string> = {
    CREATED: "cust.activity_created",
    PROFILE_UPDATED: "cust.activity_profile_updated",
    STATUS_CHANGED: "cust.activity_status_changed",
    APPOINTMENT_BOOKED: "cust.activity_appointment_booked",
    APPOINTMENT_CANCELLED: "cust.activity_appointment_cancelled",
    APPOINTMENT_COMPLETED: "cust.activity_appointment_completed",
    APPOINTMENT_NO_SHOW: "cust.activity_appointment_no_show",
    CARD_PURCHASED: "cust.activity_card_purchased",
    CARD_ACTIVATED: "cust.activity_card_activated",
    CARD_USED: "cust.activity_card_used",
    CARD_RESTORED: "cust.activity_card_restored",
    CARD_CANCELLED: "cust.activity_card_cancelled",
    PAYMENT_UPDATED: "cust.activity_payment_updated",
    NOTE_ADDED: "cust.activity_note_added",
    TAG_UPDATED: "cust.activity_tag_updated",
  };

  const key = keyMap[activity.type];
  if (!key) return activity.type;

  return t(key as Parameters<typeof t>[0], {
    service: meta.serviceName ?? "",
    card: meta.cardName ?? "",
    old: meta.oldStatus ?? "",
    new: meta.newStatus ?? "",
  });
}

function getRelativeTime(date: Date, locale: string): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return locale === "he" ? "עכשיו" : "Just now";
  if (diffMins < 60) return locale === "he" ? `לפני ${diffMins} דק׳` : `${diffMins}m ago`;
  if (diffHours < 24) return locale === "he" ? `לפני ${diffHours} שע׳` : `${diffHours}h ago`;
  if (diffDays < 7) return locale === "he" ? `לפני ${diffDays} ימים` : `${diffDays}d ago`;

  return date.toLocaleDateString(locale === "he" ? "he-IL" : "en-US", {
    month: "short",
    day: "numeric",
  });
}
