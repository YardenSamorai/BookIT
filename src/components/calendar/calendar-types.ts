import {
  BUSINESS_TZ as _BUSINESS_TZ,
  formatTimeInTz as _formatTimeInTz,
  getHoursInTz as _getHoursInTz,
  getMinutesInTz as _getMinutesInTz,
  wallClockToDate as _wallClockToDate,
} from "@/lib/tz";

export const BUSINESS_TZ = _BUSINESS_TZ;
export const getHoursInTz = _getHoursInTz;
export const getMinutesInTz = _getMinutesInTz;
export const wallClockToDate = _wallClockToDate;
export const formatTimeInTz = _formatTimeInTz;

export function formatTime(date: Date, locale: string): string {
  return _formatTimeInTz(date, locale);
}

// ---------------------------------------------------------------------------
// View types
// ---------------------------------------------------------------------------

export type CalendarViewType = "day" | "week" | "month";

// ---------------------------------------------------------------------------
// Entity types
// ---------------------------------------------------------------------------

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
  serviceId: string;
  durationMinutes: number;
  staffId: string;
  staffName: string;
  customerName: string | null;
  customerPhone: string | null;
  notes: string | null;
  source: string;
  classInstanceId: string | null;
};

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
  bookedCount: number;
};

// ---------------------------------------------------------------------------
// Overlay types (staff availability, breaks, time-off)
// ---------------------------------------------------------------------------

export type StaffDaySchedule = {
  staffId: string;
  dayOfWeek: number;
  startTime: string; // "HH:MM" from DB
  endTime: string;
  isActive: boolean;
};

export type BlockedSlot = {
  id: string;
  staffId: string;
  startTime: Date;
  endTime: Date;
  reason: string | null;
};

export type TimeOffPeriod = {
  id: string;
  staffId: string;
  startDate: string;
  endDate: string;
  reason: string | null;
};

export type BusinessHoursEntry = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isOpen: boolean;
};

// ---------------------------------------------------------------------------
// Filter state
// ---------------------------------------------------------------------------

export type FilterState = {
  staffIds: string[];
  serviceIds: string[];
  statuses: string[];
  needsAttention: boolean;
};

export const EMPTY_FILTERS: FilterState = {
  staffIds: [],
  serviceIds: [],
  statuses: [],
  needsAttention: false,
};

export function hasActiveFilters(f: FilterState): boolean {
  return (
    f.staffIds.length > 0 ||
    f.serviceIds.length > 0 ||
    f.statuses.length > 0 ||
    f.needsAttention
  );
}

// ---------------------------------------------------------------------------
// Calendar actions (permissions layer — V1: all enabled)
// ---------------------------------------------------------------------------

export type CalendarActions = {
  canConfirm: boolean;
  canComplete: boolean;
  canNoShow: boolean;
  canCancel: boolean;
  canReschedule: boolean;
  canCreate: boolean;
  canBlockTime: boolean;
  canMarkDayOff: boolean;
};

export const ALL_ACTIONS_ENABLED: CalendarActions = {
  canConfirm: true,
  canComplete: true,
  canNoShow: true,
  canCancel: true,
  canReschedule: true,
  canCreate: true,
  canBlockTime: true,
  canMarkDayOff: true,
};

// ---------------------------------------------------------------------------
// Status visual system — Color = Status
// ---------------------------------------------------------------------------

export type StatusStyle = {
  bg: string;
  border: string;
  text: string;
  dot: string;
  label: string;
};

export const STATUS_STYLES: Record<string, StatusStyle> = {
  CONFIRMED: {
    bg: "bg-emerald-50",
    border: "border-emerald-300",
    text: "text-emerald-800",
    dot: "bg-emerald-500",
    label: "Confirmed",
  },
  PENDING: {
    bg: "bg-amber-50",
    border: "border-amber-300",
    text: "text-amber-800",
    dot: "bg-amber-500",
    label: "Pending",
  },
  COMPLETED: {
    bg: "bg-slate-50",
    border: "border-slate-300",
    text: "text-slate-600",
    dot: "bg-slate-400",
    label: "Completed",
  },
  NO_SHOW: {
    bg: "bg-red-50",
    border: "border-red-300",
    text: "text-red-800",
    dot: "bg-red-500",
    label: "No-Show",
  },
  CANCELLED: {
    bg: "bg-gray-50",
    border: "border-gray-300",
    text: "text-gray-500",
    dot: "bg-gray-400",
    label: "Cancelled",
  },
};

export const CLASS_STYLE = {
  bg: "bg-violet-50",
  border: "border-violet-300",
  text: "text-violet-800",
  dot: "bg-violet-500",
};

export function getStatusStyle(status: string): StatusStyle {
  return STATUS_STYLES[status] ?? STATUS_STYLES.CONFIRMED;
}

// ---------------------------------------------------------------------------
// Staff color palette (used for provider identification dots in week/month)
// ---------------------------------------------------------------------------

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

export function getStaffColor(staffId: string, staffList: Staff[]) {
  const idx = staffList.findIndex((s) => s.id === staffId);
  return STAFF_COLORS[idx >= 0 ? idx % STAFF_COLORS.length : 0];
}

// ---------------------------------------------------------------------------
// KPI computation
// ---------------------------------------------------------------------------

export type CalendarKPIs = {
  totalAppointments: number;
  confirmed: number;
  pending: number;
  completed: number;
  noShow: number;
  totalClasses: number;
  activeProviders: number;
  conflicts: number;
};

export function computeKPIs(
  apts: Appointment[],
  classes: ClassInstance[],
  staff: Staff[]
): CalendarKPIs {
  const oneToOne = apts.filter((a) => !a.classInstanceId);
  const confirmed = oneToOne.filter((a) => a.status === "CONFIRMED").length;
  const pending = oneToOne.filter((a) => a.status === "PENDING").length;
  const completed = oneToOne.filter((a) => a.status === "COMPLETED").length;
  const noShow = oneToOne.filter((a) => a.status === "NO_SHOW").length;

  const activeStaffIds = new Set<string>();
  for (const a of oneToOne) activeStaffIds.add(a.staffId);
  for (const c of classes) activeStaffIds.add(c.staffId);

  const conflicts = countConflicts(oneToOne);

  return {
    totalAppointments: oneToOne.length,
    confirmed,
    pending,
    completed,
    noShow,
    totalClasses: classes.length,
    activeProviders: Math.min(activeStaffIds.size, staff.length),
    conflicts,
  };
}

function countConflicts(apts: Appointment[]): number {
  const byStaff = new Map<string, Appointment[]>();
  for (const a of apts) {
    const list = byStaff.get(a.staffId) ?? [];
    list.push(a);
    byStaff.set(a.staffId, list);
  }

  let conflicts = 0;
  for (const [, list] of byStaff) {
    const sorted = list.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].startTime.getTime() < sorted[i - 1].endTime.getTime()) {
        conflicts++;
      }
    }
  }
  return conflicts;
}

// ---------------------------------------------------------------------------
// Card tier classification (strict pixel-height tiers)
// ---------------------------------------------------------------------------

export type CardTier = "tiny" | "small" | "medium" | "large";

export function getCardTier(heightPx: number): CardTier {
  if (heightPx < 28) return "tiny";
  if (heightPx < 45) return "small";
  if (heightPx < 65) return "medium";
  return "large";
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isStaffOnTimeOff(
  staffId: string,
  dateStr: string,
  timeOffs: TimeOffPeriod[]
): boolean {
  return timeOffs.some(
    (to) =>
      to.staffId === staffId && dateStr >= to.startDate && dateStr <= to.endDate
  );
}

export function getStaffScheduleForDay(
  staffId: string,
  dayOfWeek: number,
  schedules: StaffDaySchedule[]
): StaffDaySchedule | null {
  return (
    schedules.find(
      (s) => s.staffId === staffId && s.dayOfWeek === dayOfWeek && s.isActive
    ) ?? null
  );
}

export function getBlockedSlotsForStaffDay(
  staffId: string,
  date: Date,
  blocked: BlockedSlot[]
): BlockedSlot[] {
  return blocked.filter((b) => {
    if (b.staffId !== staffId) return false;
    return isSameDay(b.startTime, date) || isSameDay(b.endTime, date);
  });
}

/**
 * Parses a "HH:MM" or "HH:MM:SS" time string into total minutes from midnight.
 */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
