ALTER TABLE "appointment" ADD COLUMN IF NOT EXISTS "hidden_from_list_at" timestamp with time zone;
