-- Phase 1: Unified class creation — schedule-level fields + autoManaged flag

ALTER TABLE "class_schedule" ADD COLUMN IF NOT EXISTS "duration_minutes" integer NOT NULL DEFAULT 60;
ALTER TABLE "class_schedule" ADD COLUMN IF NOT EXISTS "price" decimal(10,2);
ALTER TABLE "class_schedule" ADD COLUMN IF NOT EXISTS "deposit_amount" decimal(10,2);
ALTER TABLE "class_schedule" ADD COLUMN IF NOT EXISTS "payment_mode" payment_mode NOT NULL DEFAULT 'FREE';
ALTER TABLE "class_schedule" ADD COLUMN IF NOT EXISTS "approval_type" approval_type NOT NULL DEFAULT 'AUTO';
ALTER TABLE "class_schedule" ADD COLUMN IF NOT EXISTS "cancel_hours_before" integer;
ALTER TABLE "class_schedule" ADD COLUMN IF NOT EXISTS "reschedule_hours_before" integer;

ALTER TABLE "service" ADD COLUMN IF NOT EXISTS "auto_managed" boolean NOT NULL DEFAULT false;

-- Backfill duration_minutes from linked service for existing schedules
UPDATE "class_schedule" cs
SET "duration_minutes" = s."duration_minutes"
FROM "service" s
WHERE cs."service_id" = s."id";
