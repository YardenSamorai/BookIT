ALTER TABLE "notification_preferences"
  ADD COLUMN IF NOT EXISTS "reminders_enabled" boolean NOT NULL DEFAULT true;
