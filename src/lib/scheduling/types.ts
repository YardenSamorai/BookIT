export interface TimeSlot {
  start: Date;
  end: Date;
  bookedCount?: number;
  maxParticipants?: number;
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
