ALTER TABLE "service" ADD COLUMN "auto_managed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "class_schedule" ADD COLUMN "duration_minutes" integer DEFAULT 60 NOT NULL;--> statement-breakpoint
ALTER TABLE "class_schedule" ADD COLUMN "calendar_color" text;--> statement-breakpoint
ALTER TABLE "class_schedule" ADD COLUMN "price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "class_schedule" ADD COLUMN "deposit_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "class_schedule" ADD COLUMN "payment_mode" "payment_mode" DEFAULT 'FREE' NOT NULL;--> statement-breakpoint
ALTER TABLE "class_schedule" ADD COLUMN "approval_type" "approval_type" DEFAULT 'AUTO' NOT NULL;--> statement-breakpoint
ALTER TABLE "class_schedule" ADD COLUMN "cancel_hours_before" integer;--> statement-breakpoint
ALTER TABLE "class_schedule" ADD COLUMN "reschedule_hours_before" integer;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD COLUMN "notification_phones" jsonb DEFAULT '[]'::jsonb;