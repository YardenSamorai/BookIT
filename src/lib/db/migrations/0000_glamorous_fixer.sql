CREATE TYPE "public"."activity_actor_type" AS ENUM('SYSTEM', 'STAFF', 'CUSTOMER');--> statement-breakpoint
CREATE TYPE "public"."appointment_payment_status" AS ENUM('UNPAID', 'PAID', 'DEPOSIT_PAID', 'REFUNDED', 'ON_SITE', 'FREE', 'PACKAGE');--> statement-breakpoint
CREATE TYPE "public"."appointment_source" AS ENUM('ONLINE', 'DASHBOARD', 'WALK_IN');--> statement-breakpoint
CREATE TYPE "public"."appointment_status" AS ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');--> statement-breakpoint
CREATE TYPE "public"."approval_type" AS ENUM('AUTO', 'MANUAL');--> statement-breakpoint
CREATE TYPE "public"."business_type" AS ENUM('BARBER', 'BEAUTY', 'FITNESS', 'TUTOR', 'CLINIC', 'GENERIC');--> statement-breakpoint
CREATE TYPE "public"."cancelled_by" AS ENUM('CUSTOMER', 'BUSINESS');--> statement-breakpoint
CREATE TYPE "public"."card_actor_type" AS ENUM('SYSTEM', 'STAFF', 'CUSTOMER', 'CRON');--> statement-breakpoint
CREATE TYPE "public"."card_payment_method" AS ENUM('CASH', 'TRANSFER', 'STRIPE', 'ON_SITE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."card_payment_status" AS ENUM('PAID', 'PENDING', 'FAILED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."card_source" AS ENUM('PUBLIC_SITE', 'DASHBOARD', 'MANUAL_GRANT', 'IMPORT');--> statement-breakpoint
CREATE TYPE "public"."card_status" AS ENUM('PENDING_PAYMENT', 'ACTIVE', 'EXPIRED', 'FULLY_USED', 'CANCELLED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."card_usage_action" AS ENUM('ACTIVATED', 'USED', 'RESTORED', 'MANUAL_ADD', 'MANUAL_DEDUCT', 'EXPIRED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."class_instance_status" AS ENUM('SCHEDULED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."cta_mode" AS ENUM('BOOK_SERVICE', 'EXTERNAL_LINK', 'NONE');--> statement-breakpoint
CREATE TYPE "public"."customer_activity_type" AS ENUM('CREATED', 'PROFILE_UPDATED', 'STATUS_CHANGED', 'APPOINTMENT_BOOKED', 'APPOINTMENT_CANCELLED', 'APPOINTMENT_COMPLETED', 'APPOINTMENT_NO_SHOW', 'CARD_PURCHASED', 'CARD_ACTIVATED', 'CARD_USED', 'CARD_RESTORED', 'CARD_CANCELLED', 'PAYMENT_UPDATED', 'NOTE_ADDED', 'TAG_UPDATED');--> statement-breakpoint
CREATE TYPE "public"."customer_lifecycle_status" AS ENUM('LEAD', 'ACTIVE', 'INACTIVE', 'BLOCKED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."customer_package_status" AS ENUM('ACTIVE', 'EXPIRED', 'FULLY_USED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('EMAIL', 'WHATSAPP', 'SMS');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('QUEUED', 'SENT', 'DELIVERED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('BOOKING_CONFIRMED', 'BOOKING_OWNER', 'REMINDER', 'CANCELLATION', 'RESCHEDULE', 'OTP', 'MANUAL');--> statement-breakpoint
CREATE TYPE "public"."package_payment_status" AS ENUM('PAID', 'PENDING', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."payment_mode" AS ENUM('FULL', 'DEPOSIT', 'ON_SITE', 'CONTACT_FOR_PRICE', 'FREE');--> statement-breakpoint
CREATE TYPE "public"."performed_by" AS ENUM('SYSTEM', 'CUSTOMER', 'BUSINESS');--> statement-breakpoint
CREATE TYPE "public"."staff_assignment_mode" AS ENUM('SPECIFIC', 'LIST', 'ANY');--> statement-breakpoint
CREATE TYPE "public"."subscription_plan" AS ENUM('FREE', 'STARTER', 'PRO');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('ACTIVE', 'PAST_DUE', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('BUSINESS_OWNER', 'CUSTOMER', 'BOTH');--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text,
	"phone" text,
	"name" text NOT NULL,
	"password_hash" text,
	"avatar_url" text,
	"role" "user_role" DEFAULT 'CUSTOMER' NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"phone_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_phone_unique" UNIQUE("phone"),
	CONSTRAINT "email_or_phone_required" CHECK ("user"."email" IS NOT NULL OR "user"."phone" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "business_hours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"is_open" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"type" "business_type" NOT NULL,
	"logo_url" text,
	"cover_image_url" text,
	"primary_color" text DEFAULT '#0F172A' NOT NULL,
	"secondary_color" text DEFAULT '#3B82F6' NOT NULL,
	"timezone" text DEFAULT 'Asia/Jerusalem' NOT NULL,
	"currency" text DEFAULT 'ILS' NOT NULL,
	"language" text DEFAULT 'he' NOT NULL,
	"slot_granularity_min" integer DEFAULT 30 NOT NULL,
	"default_buffer_min" integer DEFAULT 0 NOT NULL,
	"phone" text,
	"email" text,
	"address" text,
	"subscription_plan" "subscription_plan" DEFAULT 'FREE' NOT NULL,
	"subscription_status" "subscription_status" DEFAULT 'ACTIVE' NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_blocked_slot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"staff_id" uuid NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"name" text NOT NULL,
	"role_title" text,
	"image_url" text,
	"bio" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_schedule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"staff_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_time_off" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"staff_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_staff" (
	"service_id" uuid NOT NULL,
	"staff_id" uuid NOT NULL,
	CONSTRAINT "service_staff_service_id_staff_id_pk" PRIMARY KEY("service_id","staff_id")
);
--> statement-breakpoint
CREATE TABLE "service" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"category_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"duration_minutes" integer NOT NULL,
	"buffer_minutes" integer,
	"price" numeric(10, 2),
	"deposit_amount" numeric(10, 2),
	"payment_mode" "payment_mode" DEFAULT 'FREE' NOT NULL,
	"approval_type" "approval_type" DEFAULT 'AUTO' NOT NULL,
	"cancel_hours_before" integer,
	"reschedule_hours_before" integer,
	"staff_assignment_mode" "staff_assignment_mode" DEFAULT 'ANY' NOT NULL,
	"image_url" text,
	"meeting_link" text,
	"is_group" boolean DEFAULT false NOT NULL,
	"max_participants" integer DEFAULT 1,
	"blocks_all_staff" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_package" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" uuid NOT NULL,
	"business_id" uuid NOT NULL,
	"name" text NOT NULL,
	"session_count" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"expiration_days" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"business_id" uuid NOT NULL,
	"type" "customer_activity_type" NOT NULL,
	"actor_type" "activity_actor_type" NOT NULL,
	"actor_user_id" uuid,
	"actor_name" text NOT NULL,
	"entity_type" text,
	"entity_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_note" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"business_id" uuid NOT NULL,
	"author_name" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_package" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"package_id" uuid NOT NULL,
	"business_id" uuid NOT NULL,
	"sessions_remaining" integer NOT NULL,
	"sessions_used" integer DEFAULT 0 NOT NULL,
	"purchased_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"payment_status" "package_payment_status" DEFAULT 'PENDING' NOT NULL,
	"stripe_payment_id" text,
	"status" "customer_package_status" DEFAULT 'ACTIVE' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "customer_lifecycle_status" DEFAULT 'LEAD' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"cancellation_count" integer DEFAULT 0 NOT NULL,
	"no_show_count" integer DEFAULT 0 NOT NULL,
	"birthday" date,
	"address" text,
	"source" text,
	"gender" text,
	"preferred_language" text,
	"general_notes" text,
	"sms_opt_in" boolean DEFAULT true NOT NULL,
	"whatsapp_opt_in" boolean DEFAULT true NOT NULL,
	"email_marketing_opt_in" boolean DEFAULT true NOT NULL,
	"reminder_channel" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_instance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_schedule_id" uuid NOT NULL,
	"business_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"staff_id" uuid NOT NULL,
	"date" date NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"max_participants" integer NOT NULL,
	"status" "class_instance_status" DEFAULT 'SCHEDULED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_schedule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"staff_id" uuid NOT NULL,
	"title" text,
	"days_of_week" jsonb NOT NULL,
	"start_time" text NOT NULL,
	"max_participants" integer DEFAULT 10 NOT NULL,
	"effective_from" date NOT NULL,
	"effective_until" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointment_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_id" uuid NOT NULL,
	"action" text NOT NULL,
	"old_value" text,
	"new_value" text,
	"performed_by" "performed_by" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"staff_id" uuid NOT NULL,
	"customer_package_id" uuid,
	"customer_card_id" uuid,
	"class_instance_id" uuid,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"status" "appointment_status" DEFAULT 'PENDING' NOT NULL,
	"payment_status" "appointment_payment_status" DEFAULT 'UNPAID' NOT NULL,
	"payment_amount" numeric(10, 2),
	"stripe_payment_id" text,
	"source" "appointment_source" DEFAULT 'ONLINE' NOT NULL,
	"cancel_reason" text,
	"cancelled_at" timestamp with time zone,
	"cancelled_by" "cancelled_by",
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"price" numeric(10, 2),
	"images" text[] DEFAULT '{}' NOT NULL,
	"category" text,
	"related_service_id" uuid,
	"service_package_id" uuid,
	"cta_mode" "cta_mode" DEFAULT 'NONE' NOT NULL,
	"cta_text" text,
	"external_url" text,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"sections" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"theme_preset" text DEFAULT 'modern' NOT NULL,
	"puck_data" jsonb,
	"social_links" jsonb DEFAULT '{}'::jsonb,
	"custom_css" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_template" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"body" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid,
	"appointment_id" uuid,
	"user_id" uuid,
	"channel" "notification_channel" NOT NULL,
	"type" "notification_type" NOT NULL,
	"recipient" text NOT NULL,
	"message_body" text,
	"status" "notification_status" DEFAULT 'QUEUED' NOT NULL,
	"provider" text NOT NULL,
	"provider_message_id" text,
	"error_message" text,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"reminder_hours_before" integer DEFAULT 24 NOT NULL,
	"reminder_hours_before_2" integer,
	"whatsapp_enabled" boolean DEFAULT true NOT NULL,
	"email_enabled" boolean DEFAULT true NOT NULL,
	"sms_enabled" boolean DEFAULT false NOT NULL,
	"sms_booking_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otp_verification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" text NOT NULL,
	"code" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"appointment_id" uuid,
	"service_id" uuid,
	"rating" integer NOT NULL,
	"comment" text,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "card_template_service" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"card_template_id" uuid NOT NULL,
	"service_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "card_template" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"session_count" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"expiration_days" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_purchasable" boolean DEFAULT false NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"restore_on_late_cancel" boolean DEFAULT false NOT NULL,
	"restore_on_no_show" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "card_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_card_id" uuid NOT NULL,
	"appointment_id" uuid,
	"action" "card_usage_action" NOT NULL,
	"delta_sessions" integer NOT NULL,
	"actor_type" "card_actor_type" NOT NULL,
	"performed_by_user_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_card" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"card_template_id" uuid,
	"business_id" uuid NOT NULL,
	"template_snapshot_name" text NOT NULL,
	"template_snapshot_description" text,
	"template_snapshot_session_count" integer NOT NULL,
	"template_snapshot_price" numeric(10, 2) NOT NULL,
	"template_snapshot_expiration_days" integer,
	"snapshot_restore_on_late_cancel" boolean DEFAULT false NOT NULL,
	"snapshot_restore_on_no_show" boolean DEFAULT false NOT NULL,
	"sessions_total" integer NOT NULL,
	"sessions_used" integer DEFAULT 0 NOT NULL,
	"sessions_remaining" integer NOT NULL,
	"status" "card_status" DEFAULT 'PENDING_PAYMENT' NOT NULL,
	"payment_status" "card_payment_status" DEFAULT 'PENDING' NOT NULL,
	"payment_method" "card_payment_method" DEFAULT 'OTHER' NOT NULL,
	"stripe_payment_id" text,
	"payment_confirmed_at" timestamp with time zone,
	"source" "card_source" DEFAULT 'DASHBOARD' NOT NULL,
	"notes" text,
	"purchased_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	CONSTRAINT "customer_card_sessions_total_gte_0" CHECK ("customer_card"."sessions_total" >= 0),
	CONSTRAINT "customer_card_sessions_used_gte_0" CHECK ("customer_card"."sessions_used" >= 0),
	CONSTRAINT "customer_card_sessions_remaining_gte_0" CHECK ("customer_card"."sessions_remaining" >= 0),
	CONSTRAINT "customer_card_sessions_integrity" CHECK ("customer_card"."sessions_used" + "customer_card"."sessions_remaining" = "customer_card"."sessions_total")
);
--> statement-breakpoint
ALTER TABLE "business_hours" ADD CONSTRAINT "business_hours_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business" ADD CONSTRAINT "business_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_blocked_slot" ADD CONSTRAINT "staff_blocked_slot_staff_id_staff_member_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff_member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_member" ADD CONSTRAINT "staff_member_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_schedule" ADD CONSTRAINT "staff_schedule_staff_id_staff_member_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff_member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_time_off" ADD CONSTRAINT "staff_time_off_staff_id_staff_member_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff_member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_category" ADD CONSTRAINT "service_category_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_staff" ADD CONSTRAINT "service_staff_service_id_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_staff" ADD CONSTRAINT "service_staff_staff_id_staff_member_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff_member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service" ADD CONSTRAINT "service_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service" ADD CONSTRAINT "service_category_id_service_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."service_category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_package" ADD CONSTRAINT "service_package_service_id_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_package" ADD CONSTRAINT "service_package_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_activity" ADD CONSTRAINT "customer_activity_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_activity" ADD CONSTRAINT "customer_activity_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_activity" ADD CONSTRAINT "customer_activity_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_note" ADD CONSTRAINT "customer_note_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_note" ADD CONSTRAINT "customer_note_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_package" ADD CONSTRAINT "customer_package_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_package" ADD CONSTRAINT "customer_package_package_id_service_package_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."service_package"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_package" ADD CONSTRAINT "customer_package_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer" ADD CONSTRAINT "customer_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer" ADD CONSTRAINT "customer_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_instance" ADD CONSTRAINT "class_instance_class_schedule_id_class_schedule_id_fk" FOREIGN KEY ("class_schedule_id") REFERENCES "public"."class_schedule"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_instance" ADD CONSTRAINT "class_instance_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_instance" ADD CONSTRAINT "class_instance_service_id_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_instance" ADD CONSTRAINT "class_instance_staff_id_staff_member_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff_member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_schedule" ADD CONSTRAINT "class_schedule_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_schedule" ADD CONSTRAINT "class_schedule_service_id_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_schedule" ADD CONSTRAINT "class_schedule_staff_id_staff_member_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff_member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_log" ADD CONSTRAINT "appointment_log_appointment_id_appointment_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_service_id_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_staff_id_staff_member_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff_member"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_customer_package_id_customer_package_id_fk" FOREIGN KEY ("customer_package_id") REFERENCES "public"."customer_package"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_customer_card_id_customer_card_id_fk" FOREIGN KEY ("customer_card_id") REFERENCES "public"."customer_card"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_class_instance_id_class_instance_id_fk" FOREIGN KEY ("class_instance_id") REFERENCES "public"."class_instance"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_related_service_id_service_id_fk" FOREIGN KEY ("related_service_id") REFERENCES "public"."service"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_service_package_id_service_package_id_fk" FOREIGN KEY ("service_package_id") REFERENCES "public"."service_package"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_config" ADD CONSTRAINT "site_config_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_template" ADD CONSTRAINT "message_template_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_appointment_id_appointment_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointment"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_appointment_id_appointment_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointment"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_service_id_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_template_service" ADD CONSTRAINT "card_template_service_card_template_id_card_template_id_fk" FOREIGN KEY ("card_template_id") REFERENCES "public"."card_template"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_template_service" ADD CONSTRAINT "card_template_service_service_id_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_template" ADD CONSTRAINT "card_template_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_usage" ADD CONSTRAINT "card_usage_customer_card_id_customer_card_id_fk" FOREIGN KEY ("customer_card_id") REFERENCES "public"."customer_card"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_usage" ADD CONSTRAINT "card_usage_appointment_id_appointment_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointment"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_usage" ADD CONSTRAINT "card_usage_performed_by_user_id_user_id_fk" FOREIGN KEY ("performed_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_card" ADD CONSTRAINT "customer_card_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_card" ADD CONSTRAINT "customer_card_card_template_id_card_template_id_fk" FOREIGN KEY ("card_template_id") REFERENCES "public"."card_template"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_card" ADD CONSTRAINT "customer_card_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_email_idx" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "user_phone_idx" ON "user" USING btree ("phone");--> statement-breakpoint
CREATE UNIQUE INDEX "business_hours_unique" ON "business_hours" USING btree ("business_id","day_of_week");--> statement-breakpoint
CREATE UNIQUE INDEX "business_slug_idx" ON "business" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "business_owner_idx" ON "business" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "staff_blocked_idx" ON "staff_blocked_slot" USING btree ("staff_id","start_time","end_time");--> statement-breakpoint
CREATE INDEX "staff_business_idx" ON "staff_member" USING btree ("business_id");--> statement-breakpoint
CREATE UNIQUE INDEX "staff_schedule_unique" ON "staff_schedule" USING btree ("staff_id","day_of_week");--> statement-breakpoint
CREATE INDEX "staff_timeoff_idx" ON "staff_time_off" USING btree ("staff_id","start_date","end_date");--> statement-breakpoint
CREATE INDEX "service_category_business_idx" ON "service_category" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "service_business_idx" ON "service" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "service_active_idx" ON "service" USING btree ("business_id","is_active");--> statement-breakpoint
CREATE INDEX "package_business_idx" ON "service_package" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "package_service_idx" ON "service_package" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "customer_activity_customer_idx" ON "customer_activity" USING btree ("customer_id","created_at");--> statement-breakpoint
CREATE INDEX "customer_activity_business_idx" ON "customer_activity" USING btree ("business_id","customer_id");--> statement-breakpoint
CREATE INDEX "customer_note_customer_idx" ON "customer_note" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "customer_note_business_idx" ON "customer_note" USING btree ("business_id","customer_id");--> statement-breakpoint
CREATE INDEX "customer_package_customer_idx" ON "customer_package" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "customer_package_business_idx" ON "customer_package" USING btree ("business_id","customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_business_user_unique" ON "customer" USING btree ("business_id","user_id");--> statement-breakpoint
CREATE INDEX "customer_business_idx" ON "customer" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "customer_status_idx" ON "customer" USING btree ("business_id","status");--> statement-breakpoint
CREATE INDEX "class_instance_business_date_idx" ON "class_instance" USING btree ("business_id","date");--> statement-breakpoint
CREATE INDEX "class_instance_schedule_idx" ON "class_instance" USING btree ("class_schedule_id");--> statement-breakpoint
CREATE INDEX "class_schedule_business_idx" ON "class_schedule" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "class_schedule_active_idx" ON "class_schedule" USING btree ("business_id","is_active");--> statement-breakpoint
CREATE INDEX "appointment_log_appointment_idx" ON "appointment_log" USING btree ("appointment_id");--> statement-breakpoint
CREATE INDEX "appointment_business_time_idx" ON "appointment" USING btree ("business_id","start_time");--> statement-breakpoint
CREATE INDEX "appointment_staff_time_idx" ON "appointment" USING btree ("staff_id","start_time","end_time");--> statement-breakpoint
CREATE INDEX "appointment_customer_idx" ON "appointment" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "appointment_business_status_idx" ON "appointment" USING btree ("business_id","status");--> statement-breakpoint
CREATE INDEX "product_business_idx" ON "product" USING btree ("business_id");--> statement-breakpoint
CREATE UNIQUE INDEX "site_config_business_unique" ON "site_config" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "message_template_business_idx" ON "message_template" USING btree ("business_id");--> statement-breakpoint
CREATE UNIQUE INDEX "message_template_unique" ON "message_template" USING btree ("business_id","type","channel");--> statement-breakpoint
CREATE INDEX "notification_log_business_idx" ON "notification_log" USING btree ("business_id","created_at");--> statement-breakpoint
CREATE INDEX "notification_log_appointment_idx" ON "notification_log" USING btree ("appointment_id");--> statement-breakpoint
CREATE INDEX "notification_log_provider_msg_idx" ON "notification_log" USING btree ("provider_message_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_prefs_business_unique" ON "notification_preferences" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "otp_phone_idx" ON "otp_verification" USING btree ("phone","created_at");--> statement-breakpoint
CREATE INDEX "review_business_idx" ON "review" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "review_user_idx" ON "review" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "review_business_rating_idx" ON "review" USING btree ("business_id","rating");--> statement-breakpoint
CREATE UNIQUE INDEX "card_template_service_unique" ON "card_template_service" USING btree ("card_template_id","service_id");--> statement-breakpoint
CREATE INDEX "card_template_service_template_idx" ON "card_template_service" USING btree ("card_template_id");--> statement-breakpoint
CREATE INDEX "card_template_service_service_idx" ON "card_template_service" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "card_template_business_idx" ON "card_template" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "card_template_active_idx" ON "card_template" USING btree ("business_id","is_active","is_archived");--> statement-breakpoint
CREATE INDEX "card_usage_card_idx" ON "card_usage" USING btree ("customer_card_id");--> statement-breakpoint
CREATE INDEX "card_usage_appointment_idx" ON "card_usage" USING btree ("appointment_id");--> statement-breakpoint
CREATE INDEX "card_usage_created_idx" ON "card_usage" USING btree ("customer_card_id","created_at");--> statement-breakpoint
CREATE INDEX "customer_card_customer_idx" ON "customer_card" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "customer_card_business_idx" ON "customer_card" USING btree ("business_id","customer_id");--> statement-breakpoint
CREATE INDEX "customer_card_status_idx" ON "customer_card" USING btree ("business_id","status");--> statement-breakpoint
CREATE INDEX "customer_card_eligibility_idx" ON "customer_card" USING btree ("customer_id","status","payment_status","sessions_remaining");