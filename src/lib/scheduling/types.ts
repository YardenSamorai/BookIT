export interface TimeSlot {
  start: Date;
  end: Date;
  bookedCount?: number;
  maxParticipants?: number;
  /**
   * When true, this slot is within the business's working hours and not booked,
   * but cannot be booked because it violates the business's booking policy
   * (e.g. min advance hours, same-day bookings disabled). The UI should still
   * render the slot but in a disabled/greyed-out state with a tooltip.
   */
  disabled?: boolean;
  /**
   * Machine-readable reason for the `disabled` flag. The UI maps this to a
   * localized tooltip message. Known values: "MIN_ADVANCE", "SAME_DAY".
   */
  disabledReason?: "MIN_ADVANCE" | "SAME_DAY";
}

export interface StaffAvailability {
  staffId: string;
  staffName: string;
  slots: TimeSlot[];
}

export interface DayAvailability {
  date: string;
  staffAvailability: StaffAvailability[];
}

export interface AvailabilityQuery {
  businessId: string;
  serviceId: string;
  staffId?: string;
  dateFrom: string;
  dateTo: string;
}

export interface BookingRequest {
  businessId: string;
  serviceId: string;
  staffId: string;
  customerId: string;
  startTime: Date;
  notes?: string;
}
