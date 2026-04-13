CREATE TYPE "public"."billing_status" AS ENUM('PENDING', 'PAID', 'OVERDUE', 'WAIVED');--> statement-breakpoint
CREATE TYPE "public"."subdomain_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."ticket_priority" AS ENUM('LOW', 'MEDIUM', 'HIGH');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'STAFF_NEW_BOOKING';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'STAFF_CANCELLATION';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'STAFF_RESCHEDULE';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'SUPER_ADMIN';--> statement-breakpoint
CREATE TABLE "admin_billing_record" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"period_label" text NOT NULL,
	"plan_at_time" "subscription_plan" NOT NULL,
	"amount_ils" integer NOT NULL,
	"status" "billing_status" DEFAULT 'PENDING' NOT NULL,
	"paid_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcement_dismissal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"announcement_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"dismissed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupon" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"discount_percent" integer,
	"free_months" integer,
	"target_plan" text,
	"max_uses" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	CONSTRAINT "coupon_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "system_announcement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"type" text DEFAULT 'info' NOT NULL,
	"target_plan" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "calendar_connection" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"staff_id" uuid,
	"provider" text DEFAULT 'GOOGLE' NOT NULL,
	"google_email" text NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"token_expires_at" timestamp with time zone NOT NULL,
	"calendar_id" text DEFAULT 'primary' NOT NULL,
	"sync_token" text,
	"channel_id" text,
	"channel_expiration" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_ticket" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"subject" text NOT NULL,
	"description" text NOT NULL,
	"status" "ticket_status" DEFAULT 'OPEN' NOT NULL,
	"priority" "ticket_priority" DEFAULT 'MEDIUM' NOT NULL,
	"admin_notes" text,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intake_form_submission" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"business_id" uuid NOT NULL,
	"appointment_id" uuid,
	"responses" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intake_form" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"fields" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "business" ADD COLUMN "display_name" text;--> statement-breakpoint
ALTER TABLE "business" ADD COLUMN "message_quota_override" integer;--> statement-breakpoint
ALTER TABLE "business" ADD COLUMN "gallery_quota_override" integer;--> statement-breakpoint
ALTER TABLE "business" ADD COLUMN "branding_removed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "business" ADD COLUMN "custom_subdomain" text;--> statement-breakpoint
ALTER TABLE "business" ADD COLUMN "subdomain_status" "subdomain_status";--> statement-breakpoint
ALTER TABLE "business" ADD COLUMN "subdomain_reject_reason" text;--> statement-breakpoint
ALTER TABLE "business" ADD COLUMN "subdomain_requested_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "business" ADD COLUMN "enabled_modules" text;--> statement-breakpoint
ALTER TABLE "staff_blocked_slot" ADD COLUMN "google_event_id" text;--> statement-breakpoint
ALTER TABLE "staff_member" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "staff_member" ADD COLUMN "notify_owner" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "service" ADD COLUMN "intake_form_id" uuid;--> statement-breakpoint
ALTER TABLE "appointment" ADD COLUMN "series_id" uuid;--> statement-breakpoint
ALTER TABLE "appointment" ADD COLUMN "google_event_id" text;--> statement-breakpoint
ALTER TABLE "admin_billing_record" ADD CONSTRAINT "admin_billing_record_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_dismissal" ADD CONSTRAINT "announcement_dismissal_announcement_id_system_announcement_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."system_announcement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_dismissal" ADD CONSTRAINT "announcement_dismissal_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_announcement" ADD CONSTRAINT "system_announcement_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_connection" ADD CONSTRAINT "calendar_connection_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_connection" ADD CONSTRAINT "calendar_connection_staff_id_staff_member_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff_member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket" ADD CONSTRAINT "support_ticket_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket" ADD CONSTRAINT "support_ticket_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intake_form_submission" ADD CONSTRAINT "intake_form_submission_form_id_intake_form_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."intake_form"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intake_form_submission" ADD CONSTRAINT "intake_form_submission_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intake_form_submission" ADD CONSTRAINT "intake_form_submission_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intake_form_submission" ADD CONSTRAINT "intake_form_submission_appointment_id_appointment_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointment"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intake_form" ADD CONSTRAINT "intake_form_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "billing_business_period_idx" ON "admin_billing_record" USING btree ("business_id","period_label");--> statement-breakpoint
CREATE INDEX "billing_status_idx" ON "admin_billing_record" USING btree ("status");--> statement-breakpoint
CREATE INDEX "announcement_active_idx" ON "system_announcement" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "calendar_conn_business_staff_idx" ON "calendar_connection" USING btree ("business_id","staff_id");--> statement-breakpoint
CREATE INDEX "calendar_conn_business_idx" ON "calendar_connection" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "ticket_business_idx" ON "support_ticket" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "ticket_status_idx" ON "support_ticket" USING btree ("status");--> statement-breakpoint
CREATE INDEX "intake_sub_form_idx" ON "intake_form_submission" USING btree ("form_id");--> statement-breakpoint
CREATE INDEX "intake_sub_customer_idx" ON "intake_form_submission" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "intake_sub_business_idx" ON "intake_form_submission" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "intake_sub_customer_form_idx" ON "intake_form_submission" USING btree ("customer_id","form_id");--> statement-breakpoint
CREATE INDEX "intake_form_business_idx" ON "intake_form" USING btree ("business_id");--> statement-breakpoint
ALTER TABLE "service" ADD CONSTRAINT "service_intake_form_id_intake_form_id_fk" FOREIGN KEY ("intake_form_id") REFERENCES "public"."intake_form"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "business_subdomain_idx" ON "business" USING btree ("custom_subdomain");--> statement-breakpoint
CREATE INDEX "staff_blocked_gcal_idx" ON "staff_blocked_slot" USING btree ("google_event_id");