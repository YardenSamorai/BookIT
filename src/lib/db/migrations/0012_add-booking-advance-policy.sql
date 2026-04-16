ALTER TABLE "business"
  ADD COLUMN IF NOT EXISTS "min_booking_advance_hours" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "disable_same_day_bookings" boolean NOT NULL DEFAULT false;
