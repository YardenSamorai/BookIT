export type CalendarViewType = "day" | "week" | "month";

export type Staff = {
  id: string;
  name: string;
  imageUrl: string | null;
};

export type Appointment = {
  id: string;
  status: string;
  startTime: Date;
  endTime: Date;
  serviceName: string;
  staffId: string;
  staffName: string;
  customerName: string;
  customerPhone: string | null;
  notes: string | null;
};

export const STAFF_COLORS = [
  { bg: "#DCFCE7", border: "#22C55E", text: "#14532D" },
  { bg: "#EFF6FF", border: "#3B82F6", text: "#1E3A5F" },
  { bg: "#FFF7ED", border: "#F97316", text: "#7C2D12" },
  { bg: "#FAF5FF", border: "#A855F7", text: "#3B0764" },
  { bg: "#FFF1F2", border: "#F43F5E", text: "#881337" },
  { bg: "#ECFEFF", border: "#06B6D4", text: "#164E63" },
  { bg: "#FFFBEB", border: "#EAB308", text: "#713F12" },
  { bg: "#FDF2F8", border: "#EC4899", text: "#831843" },
];

export type ClassInstance = {
  id: string;
  classScheduleId: string;
  serviceId: string;
  staffId: string;
  date: string;
  startTime: Date;
  endTime: Date;
  maxParticipants: number;
  status: string;
  serviceName: string;
  staffName: string;
  bookedCount?: number;
};

export function getStaffColor(staffId: string, staffList: Staff[]) {
  const idx = staffList.findIndex((s) => s.id === staffId);
  return STAFF_COLORS[idx >= 0 ? idx % STAFF_COLORS.length : 0];
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatTime(date: Date, locale: string): string {
  return date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
