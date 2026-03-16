# BookIT — Final Build Specification v1.0

> Implementation-ready product and architecture specification.
> This document is the single source of truth for V1 development.

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [V1 Scope](#2-v1-scope)
3. [V2 Scope](#3-v2-scope)
4. [Tech Stack & Versions](#4-tech-stack--versions)
5. [Application Architecture](#5-application-architecture)
6. [Authentication Model](#6-authentication-model)
7. [Data Model](#7-data-model)
8. [Route & Module Breakdown](#8-route--module-breakdown)
9. [Pages & Screens](#9-pages--screens)
10. [Scheduling Engine](#10-scheduling-engine)
11. [Notification System](#11-notification-system)
12. [Payments](#12-payments)
13. [MVP Constraints & Assumptions](#13-mvp-constraints--assumptions)
14. [Implementation Order](#14-implementation-order)
15. [Engineering Principles & Code Organization](#15-engineering-principles--code-organization)

---

## 1. Product Overview

### Vision

A premium, conversion-focused SaaS booking platform that lets small businesses create a branded appointment-booking website in under 3 minutes through an intuitive onboarding flow.

### Differentiation

- Visually premium UI that feels significantly better than typical booking systems
- Sub-3-minute onboarding to a live, beautiful booking site
- Flexible per-service configuration (pricing, payments, cancellation, staff assignment)
- Affordable tiered pricing for small businesses

### Target Users

Small service businesses with 1–10 staff:
- Barbers
- Beauty / cosmetics
- Fitness coaches
- Tutors
- Small clinics
- Generic service businesses

### Platform Model

Multi-tenant SaaS. Each business gets:
- A management dashboard at `app.{domain}`
- A public booking site at `{slug}.{domain}`
- Phone-OTP-based customer accounts

---

## 2. V1 Scope

### 2.1 Multi-Tenancy & Infrastructure

- Single Next.js application with subdomain routing via middleware
- Shared PostgreSQL database, tenant isolation via `business_id` on all queries
- Unique `slug` per business for subdomain resolution
- S3-compatible object storage (Cloudflare R2 or AWS S3) for images
- Deployed on Vercel
- Placeholder domain (configurable via environment variable)

### 2.2 Subscription & Feature Gating

- Plans: FREE / STARTER / PRO stored in database
- Feature gating enforced in application logic (staff limits, booking limits, feature access)
- No Stripe Billing integration in V1 — no automated charging of business owners
- Upgrade prompts in dashboard UI when limits are reached

### 2.3 Onboarding

Fast 3-screen flow targeting under 90 seconds to a live site:

- **Screen 1:** Create account (email + password) → business name → business type
- **Screen 2:** Brand setup (logo upload, primary/secondary colors, cover image) with smart template defaults
- **Screen 3:** Live preview of auto-generated site → publish button

Post-publish, the dashboard prompts the business to refine:
- Add staff members
- Configure services (template pre-populates example services)
- Set operating hours and staff schedules

Template engine generates per business type:
- Example services with realistic names, durations, prices
- Default site section configuration
- Default business operating hours

### 2.4 Staff System

- Multiple staff members per business
- Per staff: name, role title, profile image, bio, sort order, active toggle
- Staff schedule: per-day-of-week start/end time (must fall within business operating hours)
- Time off: date ranges with optional reason
- Blocked slots: specific datetime ranges with optional reason
- Staff do NOT have their own login in V1

### 2.5 Services

- Service categories for visual grouping
- Per service: title, description, duration, buffer time override, price, deposit amount
- Payment modes: FULL / DEPOSIT / ON_SITE / CONTACT_FOR_PRICE / FREE
- Approval: AUTO (instant confirm) or MANUAL (business must approve)
- Cancellation/reschedule: configurable hours-before deadline per service
- Staff assignment modes: SPECIFIC (one staff) / LIST (subset) / ANY (all active)
- Meeting link: manual URL field (no auto-integration in V1)
- Active/inactive toggle, sort order

### 2.6 Session Packages (V1 Recurring)

- Business creates packages tied to a service: name, session count, price, optional expiration (days)
- Customers purchase packages (via Stripe payment or manually added by business owner)
- Each session booked individually through the normal booking flow
- System detects active package for the selected service → skips payment, decrements remaining sessions
- Dashboard: package management, customer package tracking
- Public site: packages displayed alongside services with "Buy Package" CTA
- Expired or fully-used packages cannot be applied to new bookings

### 2.7 Booking Flow

Customer-facing, 7-step linear flow:

1. **Select service** — browse categorized service list on public site
2. **Select staff** — if assignment mode is LIST or ANY; skipped if SPECIFIC
3. **Select date/time** — calendar date picker → available time slots (computed real-time)
4. **Enter details** — full name, phone number (pre-filled for returning customers)
5. **Authenticate** — OTP verification via SMS (registers new user or logs in returning user)
6. **Payment** — Stripe Checkout if required and no active package; skipped for ON_SITE / FREE / CONTACT / package
7. **Confirmation** — appointment details, add-to-calendar link, confirmation notification sent

### 2.8 Customer Accounts

Customers can access their account at `{slug}.{domain}/account`:
- View upcoming and past appointments
- Cancel appointments (within service deadline)
- Reschedule appointments (within service deadline)
- View active session packages and remaining sessions
- Contact the business (displays business phone/email)

### 2.9 Products (Showcase Catalog)

Informational product showcase — NOT e-commerce.

Per product:
- Title, description, display price (nullable)
- Images (up to 3)
- Category label
- Related service link (optional)
- CTA mode: BOOK_SERVICE / EXTERNAL_LINK / NONE
- CTA button text (customizable)
- External URL (for EXTERNAL_LINK mode)
- Featured flag
- Visibility toggle, sort order

Public site display: visual grid section. Featured products emphasized. Each card shows image, title, price, and CTA button based on mode. "Book service" CTA links to booking flow for the related service. "External link" opens in new tab.

No cart, no checkout, no inventory, no variants, no shipping.

### 2.10 CRM (Lightweight)

- Customer list with search and filter
- Customer detail card: personal info, all appointment history, session package usage
- Metrics per customer: cancellation count, no-show count
- Tags: business-defined labels (e.g., "VIP", "new client")
- Notes: separate timestamped notes log per customer (not a single text field)

### 2.11 Cancellation & Rescheduling

- Per-service configurable deadlines (hours before appointment)
- Within deadline: customer can self-serve cancel or reschedule
- Past deadline: UI shows "Contact business" with phone/email
- Business can cancel/reschedule any appointment from dashboard at any time
- Cancellation increments customer's cancellation counter
- All status changes logged in appointment audit trail

### 2.12 Payments

- Stripe integration for customer payments
- Per-service modes: FULL / DEPOSIT / ON_SITE / CONTACT_FOR_PRICE / FREE
- Session package purchases via Stripe Checkout
- Stripe webhooks for payment confirmation
- Dashboard: payment/transaction history, basic revenue summary
- Refunds: manual via Stripe Dashboard (no in-app refund flow in V1)

### 2.13 Notifications

- Provider-abstracted notification layer
- Channels in V1: Email + WhatsApp + SMS
- Email provider: Resend (or similar)
- SMS provider: Twilio (for OTP delivery)
- WhatsApp provider: abstracted, finalized during implementation
- Notification types: booking confirmation, appointment reminder, cancellation, reschedule, OTP
- Queue-based async delivery (non-blocking)
- Notification log: every message tracked with delivery status
- Reminder timing: configurable per business (default 24h before)

### 2.14 Public Booking Site

Single-page scroll with smooth anchor navigation. Sections (all toggleable, reorderable):

| Section | Content |
|---------|---------|
| Hero | Headline, subtitle, CTA button, background image |
| About | Rich text + image |
| Services | Card grid: title, duration, price, "Book Now" per service |
| Team | Staff cards: photo, name, role, bio |
| Products | Visual grid/carousel, featured products highlighted |
| Booking | Embedded booking flow entry point |
| Contact | Phone, email, address, optional map embed |

Design requirements:
- Fully branded (business colors, logo)
- Mobile-first responsive
- Premium, conversion-focused visual design
- Theme presets (not custom CSS)
- Layout variants per section type
- Structured configurator — NOT a freeform website builder

### 2.15 Dashboard

Left sidebar navigation. Pages:

| Page | Purpose |
|------|---------|
| Overview | Today's appointments, quick stats, recent activity |
| Calendar | Week/day view with per-staff visual columns |
| Appointments | Filterable list (status, date, staff, service) |
| Customers | Searchable list + detail cards with CRM |
| Services | CRUD with full configuration + package management |
| Staff | CRUD with schedule, time off, blocked slots |
| Products | Showcase catalog management |
| Payments | Transaction history, revenue summary |
| Settings | Business info, operating hours, notification prefs, plan info |
| Site Editor | Section toggle/reorder, content editing, theme/color adjustment |

### 2.16 Analytics (Basic)

Dashboard overview cards:
- Bookings this week
- Revenue this month
- Upcoming today
- Popular services (by booking count)
- No-show rate
- Busiest hours/days (simple heatmap)

---

## 3. V2 Scope

| Feature | Description |
|---------|-------------|
| Weekly recurring appointments | Standing weekly slots, series management, exception handling |
| Auto-generated appointment series | Book once → auto-create next N at interval |
| Two-staff services | Services requiring two specific staff; intersection availability |
| Google Calendar sync | Two-way sync for staff members |
| Embeddable booking widget | JS snippet / iframe for external websites |
| Custom domains | `booking.mybusiness.com` with automated SSL |
| Staff login portal | Staff view own calendar, manage own availability |
| Product add-ons during booking | Upsell products in booking flow |
| Simple product purchase | Buy-now via Stripe (no cart, collect in store) |
| Reviews system | In-platform reviews with moderation |
| Waitlist | Join waitlist when preferred slot is taken |
| Advanced analytics | Staff performance, retention, revenue trends, cohorts |
| Multi-language (i18n) | Public site + dashboard localization |
| FAQ section | Public site section |
| Drag-and-drop calendar | Reschedule by dragging appointments |
| In-app refunds | Process refunds from dashboard |
| Intake forms | Custom per-service questions during booking |
| Bulk actions | Bulk cancel, notify, tag customers |
| Data export | CSV export of customers, appointments, revenue |
| Stripe Billing | Automated subscription charging for business owners |

---

## 4. Tech Stack & Versions

Use latest stable versions at time of implementation.

| Technology | Purpose |
|------------|---------|
| Next.js (latest stable) | Full-stack framework, App Router |
| TypeScript (latest stable) | Type safety |
| Tailwind CSS (latest stable) | Utility-first styling |
| shadcn/ui (latest stable) | Component library |
| PostgreSQL | Primary database |
| Drizzle ORM | Type-safe database access, migrations |
| Auth.js / NextAuth v5 | Authentication |
| Stripe | Customer payments |
| Twilio | SMS OTP delivery |
| Resend | Transactional email |
| Cloudflare R2 or AWS S3 | Object storage for images |
| Vercel | Hosting and deployment |

### Architectural Patterns

- App Router (no Pages Router)
- React Server Components by default
- Server Actions for mutations where appropriate
- Route Handlers for webhook endpoints and complex API logic
- Middleware for subdomain detection and route rewriting
- Drizzle schema-first with generated migrations

---

## 5. Application Architecture

### 5.1 Single-App Subdomain Routing

Three logical applications in one Next.js deployment:

| Subdomain | Internal Prefix | Purpose |
|-----------|-----------------|---------|
| `{domain}` (root) | `/(marketing)/*` | Landing page, pricing, auth |
| `app.{domain}` | `/dashboard/*` | Business management dashboard |
| `{slug}.{domain}` | `/b/*` | Public booking site + customer account |

Proxy (Next.js 16 convention, replaces deprecated `middleware.ts`) detects subdomain from the request hostname and rewrites:
- `app.{domain}/calendar` → internally serves `/dashboard/calendar`
- `{slug}.{domain}/book/123` → internally serves `/b/book/123` + sets `x-business-slug` header
- Root domain pages live under `/(marketing)` route group and require no rewriting.
The URL visible to the user remains clean (no internal prefixes exposed).

### 5.2 Project Structure

```
src/
├── middleware.ts
├── app/
│   ├── (marketing)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Landing page
│   │   ├── pricing/page.tsx
│   │   ├── login/page.tsx              # Business owner login
│   │   ├── signup/page.tsx             # Business owner signup
│   │   └── onboarding/
│   │       ├── page.tsx                # Step 1: account + biz type
│   │       ├── brand/page.tsx          # Step 2: brand setup
│   │       └── preview/page.tsx        # Step 3: preview + publish
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx                  # Sidebar shell + auth guard
│   │   ├── page.tsx                    # Overview / home
│   │   ├── calendar/page.tsx
│   │   ├── appointments/
│   │   │   ├── page.tsx                # List
│   │   │   └── [id]/page.tsx           # Detail
│   │   ├── customers/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── services/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── packages/page.tsx
│   │   ├── staff/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── products/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── payments/page.tsx
│   │   ├── settings/
│   │   │   ├── page.tsx                # General settings
│   │   │   ├── hours/page.tsx          # Operating hours
│   │   │   └── notifications/page.tsx
│   │   └── site-editor/page.tsx
│   │
│   ├── (booking)/
│   │   ├── layout.tsx                  # Themed public shell
│   │   ├── page.tsx                    # Full public booking site
│   │   ├── book/
│   │   │   └── [serviceId]/page.tsx    # Multi-step booking flow
│   │   ├── packages/
│   │   │   └── [packageId]/page.tsx    # Package purchase
│   │   └── account/
│   │       ├── page.tsx                # Customer dashboard
│   │       └── appointments/[id]/page.tsx
│   │
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── webhooks/
│       │   └── stripe/route.ts
│       ├── otp/
│       │   ├── send/route.ts
│       │   └── verify/route.ts
│       ├── upload/route.ts
│       └── notifications/
│           └── webhook/route.ts
│
├── lib/
│   ├── db/
│   │   ├── index.ts                    # Drizzle client + connection
│   │   ├── schema/
│   │   │   ├── users.ts
│   │   │   ├── businesses.ts
│   │   │   ├── staff.ts
│   │   │   ├── services.ts
│   │   │   ├── packages.ts
│   │   │   ├── customers.ts
│   │   │   ├── appointments.ts
│   │   │   ├── products.ts
│   │   │   ├── site-config.ts
│   │   │   ├── notifications.ts
│   │   │   └── index.ts                # Re-exports all schemas
│   │   ├── queries/                    # Read-only query functions
│   │   │   ├── businesses.ts
│   │   │   ├── staff.ts
│   │   │   ├── services.ts
│   │   │   ├── appointments.ts
│   │   │   ├── customers.ts
│   │   │   ├── products.ts
│   │   │   └── availability.ts
│   │   └── migrations/
│   ├── auth/
│   │   ├── config.ts                   # Auth.js configuration
│   │   ├── providers.ts                # Credentials + Google + OTP
│   │   └── guards.ts                   # Role-based access helpers
│   ├── scheduling/
│   │   ├── availability.ts             # Slot computation engine
│   │   ├── conflicts.ts                # Conflict detection
│   │   └── types.ts
│   ├── notifications/
│   │   ├── types.ts                    # Provider interface
│   │   ├── dispatcher.ts               # Channel routing + queue
│   │   ├── providers/
│   │   │   ├── email.ts                # Resend implementation
│   │   │   ├── sms.ts                  # Twilio implementation
│   │   │   └── whatsapp.ts             # WhatsApp implementation
│   │   └── templates/                  # Message templates
│   ├── payments/
│   │   ├── stripe.ts                   # Stripe client + helpers
│   │   └── types.ts
│   ├── storage/
│   │   ├── client.ts                   # S3-compatible upload client
│   │   └── types.ts
│   ├── templates/                      # Business type templates
│   │   ├── barber.ts
│   │   ├── beauty.ts
│   │   ├── fitness.ts
│   │   ├── tutor.ts
│   │   ├── clinic.ts
│   │   └── generic.ts
│   ├── plans/
│   │   ├── limits.ts                   # Plan limit definitions
│   │   └── gates.ts                    # Feature gating checks
│   └── utils/
│       ├── constants.ts
│       ├── currencies.ts               # Supported currency list
│       └── dates.ts                    # Timezone + date helpers
│
├── components/
│   ├── ui/                             # shadcn/ui primitives
│   ├── dashboard/                      # Dashboard-specific
│   │   ├── sidebar.tsx
│   │   ├── topbar.tsx
│   │   ├── stats-card.tsx
│   │   ├── calendar-view.tsx
│   │   └── ...
│   ├── booking/                        # Booking flow components
│   │   ├── service-picker.tsx
│   │   ├── staff-picker.tsx
│   │   ├── date-time-picker.tsx
│   │   ├── customer-form.tsx
│   │   ├── otp-verification.tsx
│   │   ├── payment-step.tsx
│   │   ├── confirmation.tsx
│   │   └── ...
│   ├── marketing/                      # Landing page components
│   └── public-site/                    # Public business site sections
│       ├── hero-section.tsx
│       ├── about-section.tsx
│       ├── services-section.tsx
│       ├── team-section.tsx
│       ├── products-section.tsx
│       ├── booking-section.tsx
│       ├── contact-section.tsx
│       └── ...
│
├── actions/                            # Server Actions (mutations)
│   ├── auth.ts
│   ├── business.ts
│   ├── staff.ts
│   ├── services.ts
│   ├── packages.ts
│   ├── appointments.ts
│   ├── customers.ts
│   ├── products.ts
│   ├── site-config.ts
│   └── upload.ts
│
├── validators/                         # Zod schemas (shared client+server)
│   ├── auth.ts
│   ├── business.ts
│   ├── staff.ts
│   ├── services.ts
│   ├── appointments.ts
│   ├── customers.ts
│   ├── products.ts
│   └── site-config.ts
│
└── types/
    └── index.ts                        # Shared TypeScript types
```

### 5.3 Middleware Logic

```
Request → Extract hostname → Parse subdomain

IF no subdomain or "www":
  → Rewrite to /(marketing)/* routes
  → No auth required (except onboarding)

IF subdomain === "app":
  → Rewrite to /(dashboard)/* routes
  → Require business owner session (redirect to /login if missing)

ELSE (subdomain = business slug):
  → Look up business by slug (cache aggressively)
  → If not found → 404 page
  → If found → Rewrite to /(booking)/* routes
  → Inject businessId via request header or cookie
  → Customer auth optional (required only at booking step 5)
```

---

## 6. Authentication Model

### 6.1 Business Owners

| Property | Value |
|----------|-------|
| Identifier | Email |
| Auth method | Email + password |
| OAuth | Google (optional) |
| Session | HTTP-only secure cookie, 7-day expiry |
| Verification | Email verification link |
| Password reset | Email-based reset link |
| Role | `BUSINESS_OWNER` |

### 6.2 Customers

| Property | Value |
|----------|-------|
| Identifier | Phone number |
| Auth method | SMS OTP (Twilio) |
| Required fields | Full name + phone number |
| Session | HTTP-only secure cookie, 30-day expiry |
| Flow | Enter phone → receive OTP → verify → if new: enter name → done |
| Role | `CUSTOMER` |

### 6.3 Auth.js Configuration

- `CredentialsProvider` for business owner email+password
- `GoogleProvider` for business owner OAuth
- Custom OTP provider (phone-based, via Route Handlers for send/verify)
- JWT strategy with role claim (`BUSINESS_OWNER` | `CUSTOMER`)
- Middleware reads role + subdomain to enforce route access

### 6.4 OTP Table

Verification codes stored temporarily:

| Field | Type |
|-------|------|
| id | UUID PK |
| phone | text |
| code | text (6-digit) |
| expires_at | timestamptz |
| verified | boolean |
| attempts | integer (max 3) |
| created_at | timestamptz |

Codes expire after 5 minutes. Max 3 verification attempts per code. Rate limit: max 3 OTP requests per phone per 10 minutes.

---

## 7. Data Model

### Entity Relationship Overview

```
USER (global identity)
 ├── 1:N → BUSINESS (as owner)
 └── 1:N → CUSTOMER (as client at various businesses)

BUSINESS
 ├── 1:N → BUSINESS_HOURS
 ├── 1:N → STAFF_MEMBER
 │          ├── 1:N → STAFF_SCHEDULE
 │          ├── 1:N → STAFF_TIME_OFF
 │          └── 1:N → STAFF_BLOCKED_SLOT
 ├── 1:N → SERVICE_CATEGORY
 ├── 1:N → SERVICE
 │          ├── N:M → STAFF_MEMBER (via SERVICE_STAFF)
 │          └── 1:N → SERVICE_PACKAGE
 ├── 1:N → CUSTOMER
 │          ├── 1:N → CUSTOMER_NOTE
 │          └── 1:N → CUSTOMER_PACKAGE
 ├── 1:N → APPOINTMENT
 │          └── 1:N → APPOINTMENT_LOG
 ├── 1:N → PRODUCT
 ├── 1:1 → SITE_CONFIG
 ├── 1:1 → NOTIFICATION_PREFERENCES
 └── 1:N → NOTIFICATION_LOG
```

### Full Schema

#### USER
```
id                      UUID PK DEFAULT gen_random_uuid()
email                   text UNIQUE NULLABLE
phone                   text UNIQUE NULLABLE
name                    text NOT NULL
password_hash           text NULLABLE
avatar_url              text NULLABLE
role                    enum(BUSINESS_OWNER, CUSTOMER, BOTH)
email_verified          boolean DEFAULT false
phone_verified          boolean DEFAULT false
created_at              timestamptz DEFAULT now()
updated_at              timestamptz DEFAULT now()

CHECK (email IS NOT NULL OR phone IS NOT NULL)
INDEX(email) WHERE email IS NOT NULL
INDEX(phone) WHERE phone IS NOT NULL
```

#### BUSINESS
```
id                      UUID PK DEFAULT gen_random_uuid()
owner_id                FK → USER NOT NULL
slug                    text UNIQUE NOT NULL
name                    text NOT NULL
type                    enum(BARBER, BEAUTY, FITNESS, TUTOR, CLINIC, GENERIC)
logo_url                text NULLABLE
cover_image_url         text NULLABLE
primary_color           text NOT NULL DEFAULT '#0F172A'
secondary_color         text NOT NULL DEFAULT '#3B82F6'
timezone                text NOT NULL DEFAULT 'Asia/Jerusalem'
currency                text NOT NULL DEFAULT 'ILS'
slot_granularity_min    integer NOT NULL DEFAULT 30
default_buffer_min      integer NOT NULL DEFAULT 0
phone                   text NULLABLE
email                   text NULLABLE
address                 text NULLABLE
subscription_plan       enum(FREE, STARTER, PRO) DEFAULT FREE
subscription_status     enum(ACTIVE, PAST_DUE, CANCELLED) DEFAULT ACTIVE
published               boolean DEFAULT false
created_at              timestamptz DEFAULT now()
updated_at              timestamptz DEFAULT now()

INDEX(slug) UNIQUE
INDEX(owner_id)
```

#### BUSINESS_HOURS
```
id                      UUID PK DEFAULT gen_random_uuid()
business_id             FK → BUSINESS NOT NULL
day_of_week             integer NOT NULL (0=Sunday ... 6=Saturday)
start_time              time NOT NULL
end_time                time NOT NULL
is_open                 boolean DEFAULT true

UNIQUE(business_id, day_of_week)
```

#### STAFF_MEMBER
```
id                      UUID PK DEFAULT gen_random_uuid()
business_id             FK → BUSINESS NOT NULL
name                    text NOT NULL
role_title              text NULLABLE
image_url               text NULLABLE
bio                     text NULLABLE
sort_order              integer DEFAULT 0
is_active               boolean DEFAULT true
created_at              timestamptz DEFAULT now()
updated_at              timestamptz DEFAULT now()

INDEX(business_id)
```

#### STAFF_SCHEDULE
```
id                      UUID PK DEFAULT gen_random_uuid()
staff_id                FK → STAFF_MEMBER NOT NULL
day_of_week             integer NOT NULL (0–6)
start_time              time NOT NULL
end_time                time NOT NULL
is_active               boolean DEFAULT true

UNIQUE(staff_id, day_of_week)
-- APP CONSTRAINT: must fall within BUSINESS_HOURS for same day
```

#### STAFF_TIME_OFF
```
id                      UUID PK DEFAULT gen_random_uuid()
staff_id                FK → STAFF_MEMBER NOT NULL
start_date              date NOT NULL
end_date                date NOT NULL
reason                  text NULLABLE
created_at              timestamptz DEFAULT now()

INDEX(staff_id, start_date, end_date)
```

#### STAFF_BLOCKED_SLOT
```
id                      UUID PK DEFAULT gen_random_uuid()
staff_id                FK → STAFF_MEMBER NOT NULL
start_time              timestamptz NOT NULL
end_time                timestamptz NOT NULL
reason                  text NULLABLE
created_at              timestamptz DEFAULT now()

INDEX(staff_id, start_time, end_time)
```

#### SERVICE_CATEGORY
```
id                      UUID PK DEFAULT gen_random_uuid()
business_id             FK → BUSINESS NOT NULL
name                    text NOT NULL
sort_order              integer DEFAULT 0

INDEX(business_id)
```

#### SERVICE
```
id                      UUID PK DEFAULT gen_random_uuid()
business_id             FK → BUSINESS NOT NULL
category_id             FK → SERVICE_CATEGORY NULLABLE
title                   text NOT NULL
description             text NULLABLE
duration_minutes        integer NOT NULL
buffer_minutes          integer NULLABLE
price                   decimal(10,2) NULLABLE
deposit_amount          decimal(10,2) NULLABLE
payment_mode            enum(FULL, DEPOSIT, ON_SITE, CONTACT_FOR_PRICE, FREE)
approval_type           enum(AUTO, MANUAL) DEFAULT AUTO
cancel_hours_before     integer NULLABLE
reschedule_hours_before integer NULLABLE
staff_assignment_mode   enum(SPECIFIC, LIST, ANY) DEFAULT ANY
meeting_link            text NULLABLE
is_active               boolean DEFAULT true
sort_order              integer DEFAULT 0
created_at              timestamptz DEFAULT now()
updated_at              timestamptz DEFAULT now()

INDEX(business_id)
INDEX(business_id, is_active)
```

#### SERVICE_STAFF
```
service_id              FK → SERVICE NOT NULL
staff_id                FK → STAFF_MEMBER NOT NULL

PK(service_id, staff_id)
```

#### SERVICE_PACKAGE
```
id                      UUID PK DEFAULT gen_random_uuid()
service_id              FK → SERVICE NOT NULL
business_id             FK → BUSINESS NOT NULL
name                    text NOT NULL
session_count           integer NOT NULL
price                   decimal(10,2) NOT NULL
expiration_days         integer NULLABLE
is_active               boolean DEFAULT true
created_at              timestamptz DEFAULT now()
updated_at              timestamptz DEFAULT now()

INDEX(business_id)
INDEX(service_id)
```

#### CUSTOMER
```
id                      UUID PK DEFAULT gen_random_uuid()
business_id             FK → BUSINESS NOT NULL
user_id                 FK → USER NOT NULL
tags                    text[] DEFAULT '{}'
cancellation_count      integer DEFAULT 0
no_show_count           integer DEFAULT 0
created_at              timestamptz DEFAULT now()
updated_at              timestamptz DEFAULT now()

UNIQUE(business_id, user_id)
INDEX(business_id)
```

#### CUSTOMER_NOTE
```
id                      UUID PK DEFAULT gen_random_uuid()
customer_id             FK → CUSTOMER NOT NULL
business_id             FK → BUSINESS NOT NULL
author_name             text NOT NULL
content                 text NOT NULL
created_at              timestamptz DEFAULT now()

INDEX(customer_id)
INDEX(business_id, customer_id)
```

#### CUSTOMER_PACKAGE
```
id                      UUID PK DEFAULT gen_random_uuid()
customer_id             FK → CUSTOMER NOT NULL
package_id              FK → SERVICE_PACKAGE NOT NULL
business_id             FK → BUSINESS NOT NULL
sessions_remaining      integer NOT NULL
sessions_used           integer DEFAULT 0
purchased_at            timestamptz NOT NULL DEFAULT now()
expires_at              timestamptz NULLABLE
payment_status          enum(PAID, PENDING, FAILED) DEFAULT PENDING
stripe_payment_id       text NULLABLE
status                  enum(ACTIVE, EXPIRED, FULLY_USED, CANCELLED) DEFAULT ACTIVE

INDEX(customer_id)
INDEX(business_id, customer_id)
```

#### APPOINTMENT
```
id                      UUID PK DEFAULT gen_random_uuid()
business_id             FK → BUSINESS NOT NULL
customer_id             FK → CUSTOMER NOT NULL
service_id              FK → SERVICE NOT NULL
staff_id                FK → STAFF_MEMBER NOT NULL
customer_package_id     FK → CUSTOMER_PACKAGE NULLABLE
start_time              timestamptz NOT NULL
end_time                timestamptz NOT NULL
status                  enum(PENDING, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW)
payment_status          enum(UNPAID, PAID, DEPOSIT_PAID, REFUNDED, ON_SITE, FREE, PACKAGE)
payment_amount          decimal(10,2) NULLABLE
stripe_payment_id       text NULLABLE
source                  enum(ONLINE, DASHBOARD, WALK_IN) DEFAULT ONLINE
cancel_reason           text NULLABLE
cancelled_at            timestamptz NULLABLE
cancelled_by            enum(CUSTOMER, BUSINESS) NULLABLE
notes                   text NULLABLE
created_at              timestamptz DEFAULT now()
updated_at              timestamptz DEFAULT now()

INDEX(business_id, start_time)
INDEX(staff_id, start_time, end_time)
INDEX(customer_id)
INDEX(business_id, status)
```

#### APPOINTMENT_LOG
```
id                      UUID PK DEFAULT gen_random_uuid()
appointment_id          FK → APPOINTMENT NOT NULL
action                  text NOT NULL
old_value               text NULLABLE
new_value               text NULLABLE
performed_by            enum(SYSTEM, CUSTOMER, BUSINESS)
created_at              timestamptz DEFAULT now()

INDEX(appointment_id)
```

#### PRODUCT
```
id                      UUID PK DEFAULT gen_random_uuid()
business_id             FK → BUSINESS NOT NULL
title                   text NOT NULL
description             text NULLABLE
price                   decimal(10,2) NULLABLE
images                  text[] DEFAULT '{}'
category                text NULLABLE
related_service_id      FK → SERVICE NULLABLE
cta_mode                enum(BOOK_SERVICE, EXTERNAL_LINK, NONE) DEFAULT NONE
cta_text                text NULLABLE
external_url            text NULLABLE
is_featured             boolean DEFAULT false
is_visible              boolean DEFAULT true
sort_order              integer DEFAULT 0
created_at              timestamptz DEFAULT now()
updated_at              timestamptz DEFAULT now()

INDEX(business_id)
```

#### SITE_CONFIG
```
id                      UUID PK DEFAULT gen_random_uuid()
business_id             FK → BUSINESS UNIQUE NOT NULL
sections                jsonb NOT NULL DEFAULT '[]'
theme_preset            text NOT NULL DEFAULT 'default'
created_at              timestamptz DEFAULT now()
updated_at              timestamptz DEFAULT now()
```

Sections JSONB structure:
```json
[
  {
    "type": "hero",
    "enabled": true,
    "order": 0,
    "layout": "centered",
    "content": {
      "headline": "...",
      "subtitle": "...",
      "cta_text": "Book Now",
      "background_image_url": "..."
    }
  },
  {
    "type": "about",
    "enabled": true,
    "order": 1,
    "layout": "image-left",
    "content": {
      "text": "...",
      "image_url": "..."
    }
  },
  {
    "type": "services",
    "enabled": true,
    "order": 2,
    "layout": "grid-3",
    "content": {}
  },
  {
    "type": "team",
    "enabled": true,
    "order": 3,
    "layout": "cards",
    "content": {}
  },
  {
    "type": "products",
    "enabled": true,
    "order": 4,
    "layout": "carousel",
    "content": {}
  },
  {
    "type": "booking",
    "enabled": true,
    "order": 5,
    "layout": "default",
    "content": {}
  },
  {
    "type": "contact",
    "enabled": true,
    "order": 6,
    "layout": "default",
    "content": {
      "show_map": false
    }
  }
]
```

#### NOTIFICATION_PREFERENCES
```
id                      UUID PK DEFAULT gen_random_uuid()
business_id             FK → BUSINESS UNIQUE NOT NULL
reminder_hours_before   integer DEFAULT 24
whatsapp_enabled        boolean DEFAULT true
email_enabled           boolean DEFAULT true
sms_enabled             boolean DEFAULT false
created_at              timestamptz DEFAULT now()
updated_at              timestamptz DEFAULT now()
```

#### NOTIFICATION_LOG
```
id                      UUID PK DEFAULT gen_random_uuid()
business_id             FK → BUSINESS NOT NULL
appointment_id          FK → APPOINTMENT NULLABLE
user_id                 FK → USER NULLABLE
channel                 enum(EMAIL, WHATSAPP, SMS)
type                    enum(BOOKING_CONFIRMED, REMINDER, CANCELLATION, RESCHEDULE, OTP, MANUAL)
recipient               text NOT NULL
status                  enum(QUEUED, SENT, DELIVERED, FAILED)
provider                text NOT NULL
provider_message_id     text NULLABLE
error_message           text NULLABLE
sent_at                 timestamptz NULLABLE
created_at              timestamptz DEFAULT now()

INDEX(business_id, created_at)
INDEX(appointment_id)
```

#### OTP_VERIFICATION
```
id                      UUID PK DEFAULT gen_random_uuid()
phone                   text NOT NULL
code                    text NOT NULL
expires_at              timestamptz NOT NULL
verified                boolean DEFAULT false
attempts                integer DEFAULT 0
created_at              timestamptz DEFAULT now()

INDEX(phone, created_at)
```

---

## 8. Route & Module Breakdown

### 8.1 Server Actions (Primary Mutation Layer)

| Module | Actions |
|--------|---------|
| `actions/auth.ts` | loginBusinessOwner, registerBusinessOwner, sendOTP, verifyOTP, loginCustomer |
| `actions/business.ts` | createBusiness, updateBusiness, updateBusinessHours, publishSite |
| `actions/staff.ts` | createStaff, updateStaff, deleteStaff, setStaffSchedule, addTimeOff, removeTimeOff, addBlockedSlot, removeBlockedSlot |
| `actions/services.ts` | createService, updateService, deleteService, createCategory, updateCategory, reorderServices |
| `actions/packages.ts` | createPackage, updatePackage, deactivatePackage, assignPackageToCustomer |
| `actions/appointments.ts` | createAppointment, confirmAppointment, cancelAppointment, rescheduleAppointment, markNoShow, markCompleted |
| `actions/customers.ts` | getCustomers, getCustomerDetail, addCustomerNote, updateCustomerTags |
| `actions/products.ts` | createProduct, updateProduct, deleteProduct, reorderProducts |
| `actions/site-config.ts` | updateSiteConfig, updateSectionContent, reorderSections, toggleSection |
| `actions/upload.ts` | uploadImage, deleteImage |

### 8.2 Route Handlers (Webhook & External API)

| Route | Purpose |
|-------|---------|
| `api/auth/[...nextauth]/route.ts` | Auth.js catch-all handler |
| `api/otp/send/route.ts` | Send OTP to phone number |
| `api/otp/verify/route.ts` | Verify OTP code |
| `api/webhooks/stripe/route.ts` | Stripe payment webhook receiver |
| `api/upload/route.ts` | Signed URL generation for S3 upload |
| `api/notifications/webhook/route.ts` | Notification delivery status webhooks |

### 8.3 Key Data Fetching (Server Components)

| Context | Query |
|---------|-------|
| Booking site | Fetch business + site config + services + staff + products by slug |
| Availability | Compute available slots for service + staff + date |
| Dashboard overview | Today's appointments + weekly stats + recent activity |
| Calendar | Appointments for date range, grouped by staff |
| Customer detail | Customer + all appointments + notes + packages |

---

## 9. Pages & Screens

### 9.1 Marketing (root domain)

| Page | Route | Purpose |
|------|-------|---------|
| Landing | `/` | Hero, features, pricing preview, CTA |
| Pricing | `/pricing` | Plan comparison table |
| Login | `/login` | Business owner email+password / Google |
| Signup | `/signup` | Business owner registration |
| Onboarding Step 1 | `/onboarding` | Biz name + type |
| Onboarding Step 2 | `/onboarding/brand` | Logo, colors, cover |
| Onboarding Step 3 | `/onboarding/preview` | Live preview + publish |

### 9.2 Dashboard (app subdomain)

| Page | Route | Purpose |
|------|-------|---------|
| Overview | `/` | Stats, today's appointments, quick actions |
| Calendar | `/calendar` | Week/day view, per-staff columns |
| Appointments | `/appointments` | Filterable list |
| Appointment Detail | `/appointments/[id]` | Full detail, actions, logs |
| Customers | `/customers` | Searchable list |
| Customer Detail | `/customers/[id]` | Card, history, notes, packages, tags |
| Services | `/services` | List with categories |
| New Service | `/services/new` | Create form |
| Edit Service | `/services/[id]` | Edit form + package management |
| Packages | `/services/packages` | All packages across services |
| Staff | `/staff` | Staff list |
| New Staff | `/staff/new` | Create form |
| Edit Staff | `/staff/[id]` | Edit + schedule + time off |
| Products | `/products` | Product catalog list |
| New Product | `/products/new` | Create form |
| Edit Product | `/products/[id]` | Edit form |
| Payments | `/payments` | Transaction history, revenue |
| Settings | `/settings` | Business info, currency, timezone |
| Operating Hours | `/settings/hours` | Business hours + staff schedule overview |
| Notification Settings | `/settings/notifications` | Channel toggles, reminder timing |
| Site Editor | `/site-editor` | Section management, theme, colors, content |

### 9.3 Public Booking Site (business slug subdomain)

| Page | Route | Purpose |
|------|-------|---------|
| Business Home | `/` | Single-page scroll with all enabled sections |
| Booking Flow | `/book/[serviceId]` | Multi-step: staff → date → details → OTP → pay → confirm |
| Package Purchase | `/packages/[packageId]` | Package details → OTP → pay → confirm |
| Customer Account | `/account` | Upcoming/past appointments, packages |
| Appointment Detail | `/account/appointments/[id]` | Detail, cancel, reschedule |

---

## 10. Scheduling Engine

### 10.1 Availability Computation

Slot availability is computed on-the-fly, never pre-generated.

**Algorithm:**

```
getAvailableSlots(serviceId, staffId, date):

  1. Load service (duration_minutes, buffer_minutes)
  2. Load business (slot_granularity_min, default_buffer_min, timezone)
  3. Load business_hours for date's day_of_week
     → If business is closed that day → return []
  4. Load staff_schedule for date's day_of_week
     → If staff not working → return []
  5. Compute working window = INTERSECTION(business_hours, staff_schedule)
  6. Check staff_time_off — if date falls in any range → return []
  7. Load staff_blocked_slots overlapping this date
  8. Load existing appointments for staff on this date (status != CANCELLED)
  9. Compute effective buffer = service.buffer_minutes ?? business.default_buffer_min
  10. Generate candidate slots at granularity intervals within working window
  11. For each candidate slot:
      - slot_end = slot_start + service.duration_minutes
      - buffered_end = slot_end + effective_buffer
      - Reject if slot_end exceeds working window
      - Reject if slot overlaps any blocked slot
      - Reject if slot overlaps any existing appointment
        (including their buffers)
  12. Return remaining valid slots
```

### 10.2 Multi-Staff Availability

When a service has `staff_assignment_mode = LIST` or `ANY`:

```
getAvailableStaffAndSlots(serviceId, date):

  1. Determine eligible staff (LIST → service_staff rows, ANY → all active staff)
  2. For each eligible staff member:
     → Run getAvailableSlots(serviceId, staffId, date)
  3. Return { staffId, staffName, slots[] } for each staff with ≥1 available slot
```

### 10.3 Conflict Prevention

- Before confirming any appointment, re-check availability (double-check pattern)
- Use database-level advisory lock or SELECT FOR UPDATE on the staff+timeslot to prevent race conditions
- Appointment status PENDING still blocks the slot (manual approval flow)

---

## 11. Notification System

### 11.1 Architecture

```
Trigger (booking, reminder, cancel, OTP)
  → NotificationDispatcher
    → Determine channels (email? whatsapp? sms?)
    → For each channel:
      → Resolve provider (Resend / Twilio / WhatsApp provider)
      → Build message from template
      → Enqueue for delivery
    → Log to NOTIFICATION_LOG

Background worker processes queue:
  → Call provider API
  → Update log status (SENT / FAILED)
  → Handle retries (max 3 attempts)
```

### 11.2 Provider Interface

```typescript
interface NotificationProvider {
  channel: 'email' | 'sms' | 'whatsapp'
  send(params: {
    recipient: string
    template: string
    variables: Record<string, string>
  }): Promise<{ messageId: string }>
}
```

All providers implement this interface. Swapping providers means implementing a new class — zero changes to business logic.

### 11.3 Notification Types

| Type | Trigger | Channels |
|------|---------|----------|
| Booking confirmed | Appointment created + confirmed | Email + WhatsApp |
| Booking pending | Appointment created + manual approval | Email + WhatsApp |
| Appointment reminder | Cron job (X hours before) | WhatsApp (primary) + Email |
| Cancellation | Appointment cancelled | Email + WhatsApp |
| Reschedule | Appointment rescheduled | Email + WhatsApp |
| OTP | Customer login/register | SMS |

### 11.4 Background Jobs

Use Vercel Cron + an async job approach:

- **Reminder cron:** runs every 15 minutes, queries appointments where `start_time - now() <= reminder_hours_before` and no reminder sent yet
- **Notification delivery:** async function triggered after enqueue (Vercel serverless or edge function)
- **Cleanup cron:** purge expired OTP codes, mark expired packages

---

## 12. Payments

### 12.1 Stripe Integration

| Flow | Implementation |
|------|---------------|
| Service payment (full) | Stripe Checkout Session → redirect → webhook confirms |
| Service deposit | Stripe Checkout Session with deposit amount → webhook |
| Package purchase | Stripe Checkout Session for package price → webhook |
| On-site | No Stripe involved; payment_status = ON_SITE |
| Free | No Stripe involved; payment_status = FREE |
| Contact for price | Booking created with payment_status = UNPAID; business contacts customer |
| Package session | No Stripe involved; payment_status = PACKAGE; decrement sessions_remaining |

### 12.2 Stripe Setup

- Each BUSINESS has a connected Stripe account (Stripe Connect — Standard or Express) if they accept online payments
- Alternatively for V1 simplicity: platform-level Stripe account with metadata tagging per business (simpler but less scalable)
- **Decision: V1 uses platform-level Stripe account. V2 migrates to Stripe Connect for proper multi-tenant payouts.**

### 12.3 Webhook Handler

Listens for:
- `checkout.session.completed` → update appointment or customer_package payment_status
- `payment_intent.payment_failed` → mark failed, notify business

---

## 13. MVP Constraints & Assumptions

### Constraints

| Constraint | Detail |
|------------|--------|
| Single currency per business | Business selects currency at setup; all prices in that currency |
| No multi-branch | One business = one location |
| No multi-language | UI in English only for V1 |
| No custom domains | Only `{slug}.{domain}` subdomains |
| No staff login | Only business owner accesses dashboard |
| No in-app refunds | Refunds via Stripe Dashboard |
| No SaaS billing | Plans tracked in DB, no automated charging |
| No cart or e-commerce | Products are showcase only |
| No file type beyond images | Upload supports JPG, PNG, WebP only |
| Max 3 images per product | Array capped in application logic |
| No real-time updates | Dashboard uses standard request/response, no WebSockets |
| Platform-level Stripe | Not Stripe Connect (simplifies V1) |

### Assumptions

| Assumption | Detail |
|------------|--------|
| Business owner manages all staff | Staff are data records, not user accounts |
| One timezone per business | All times displayed in business timezone |
| Customers can be clients at multiple businesses | Global USER → per-business CUSTOMER record |
| Template generates working defaults | Business can publish without any manual configuration |
| Buffer time applies after appointment | Buffer is cleanup time, not prep time |
| Slot granularity is uniform | All services for a business use the same slot grid |
| OTP is sole customer auth | No password, no social login for customers |
| WhatsApp requires business-initiated templates | Reminder/confirmation messages use pre-approved templates |

---

## 14. Implementation Order

### Phase 1: Foundation (Week 1–2)

Build the skeleton that everything else depends on.

| # | Task | Details |
|---|------|---------|
| 1.1 | Project scaffolding | Next.js + TypeScript + Tailwind + shadcn/ui setup |
| 1.2 | Database setup | PostgreSQL + Drizzle ORM + connection config |
| 1.3 | Schema & migrations | All core tables created and migrated |
| 1.4 | Middleware | Subdomain detection + route rewriting |
| 1.5 | Auth (business owner) | Email+password + Google OAuth via Auth.js |
| 1.6 | Auth (customer OTP) | SMS OTP flow via Twilio + Route Handlers |
| 1.7 | File upload | S3-compatible upload with signed URLs |
| 1.8 | Plan/feature gating | Utility functions for limit checks |

### Phase 2: Business Setup (Week 2–3)

Enable business owners to configure their business.

| # | Task | Details |
|---|------|---------|
| 2.1 | Onboarding flow | 3-screen wizard with template engine |
| 2.2 | Dashboard layout | Sidebar shell, topbar, responsive frame |
| 2.3 | Business settings | Info, timezone, currency, operating hours |
| 2.4 | Staff CRUD | Create/edit/delete + schedule + time off + blocked slots |
| 2.5 | Service CRUD | Create/edit/delete + categories + full config |
| 2.6 | Service packages | Create/edit + link to services |

### Phase 3: Public Site (Week 3–4)

The customer-facing experience.

| # | Task | Details |
|---|------|---------|
| 3.1 | Public site renderer | Section-based single-page layout + theming |
| 3.2 | Site editor | Dashboard page for section management + content editing |
| 3.3 | Theme presets | 3-4 visual presets with color/layout variants |
| 3.4 | Responsive polish | Mobile-first design pass on all public sections |

### Phase 4: Booking Engine (Week 4–5)

The core product — appointment booking.

| # | Task | Details |
|---|------|---------|
| 4.1 | Scheduling engine | Availability computation algorithm |
| 4.2 | Booking flow UI | 7-step flow (service → staff → date → details → OTP → pay → confirm) |
| 4.3 | Appointment creation | Server action + conflict check + status management |
| 4.4 | Stripe integration | Checkout sessions + webhook handler |
| 4.5 | Customer account | View/cancel/reschedule appointments |
| 4.6 | Package booking | Detect active package → skip payment → decrement |

### Phase 5: Dashboard Features (Week 5–6)

Management tools for the business owner.

| # | Task | Details |
|---|------|---------|
| 5.1 | Calendar view | Week/day with per-staff columns |
| 5.2 | Appointment management | List, filter, detail, approve/reject, no-show, complete |
| 5.3 | Customer management | List, detail cards, notes, tags |
| 5.4 | Product management | CRUD with images, CTA config, visibility |
| 5.5 | Payment dashboard | Transaction list, revenue summary |
| 5.6 | Analytics overview | Stats cards, popular services, basic charts |

### Phase 6: Notifications (Week 6–7)

Connect the communication layer.

| # | Task | Details |
|---|------|---------|
| 6.1 | Notification dispatcher | Provider abstraction + channel routing |
| 6.2 | Email provider | Resend integration + templates |
| 6.3 | WhatsApp provider | Abstracted implementation + templates |
| 6.4 | Booking notifications | Confirmation + cancellation + reschedule |
| 6.5 | Reminder cron | Scheduled job for appointment reminders |
| 6.6 | Notification preferences | Business settings for channels + timing |

### Phase 7: Polish & Launch Prep (Week 7–8)

| # | Task | Details |
|---|------|---------|
| 7.1 | Marketing landing page | Hero, features, pricing, CTA |
| 7.2 | Visual polish | Premium design pass on all surfaces |
| 7.3 | Error handling | Graceful error states, loading states, empty states |
| 7.4 | Edge cases | Timezone handling, concurrent booking prevention, expired packages |
| 7.5 | Mobile responsiveness | Final pass on all dashboard + booking screens |
| 7.6 | SEO | Meta tags, OG images for public sites, sitemap |
| 7.7 | Performance | Image optimization, query optimization, caching strategy |

---

## Appendix: Supported Currencies (Initial Set)

```
ILS  Israeli New Shekel  ₪
USD  US Dollar           $
EUR  Euro                €
GBP  British Pound       £
```

Configurable per business. Extensible via `lib/utils/currencies.ts`.

## Appendix: Business Type Templates

Each template pre-populates:

| Template | Example Services | Default Hours |
|----------|-----------------|---------------|
| BARBER | Haircut (30min, ₪60), Beard Trim (20min, ₪40), Hair + Beard (45min, ₪90) | Sun–Thu 9:00–20:00 |
| BEAUTY | Manicure (45min, ₪80), Facial (60min, ₪150), Lash Extensions (90min, ₪200) | Sun–Fri 9:00–19:00 |
| FITNESS | Personal Training (60min, ₪120), Assessment (45min, ₪80) | Sun–Thu 6:00–22:00 |
| TUTOR | Private Lesson (60min, ₪100), Group Session (90min, ₪70) | Sun–Thu 14:00–21:00 |
| CLINIC | Consultation (30min, ₪200), Treatment (60min, ₪400) | Sun–Thu 8:00–17:00 |
| GENERIC | Consultation (30min), Service (60min) | Sun–Thu 9:00–18:00 |

## Appendix: Plan Limits (Configurable)

| Limit | FREE | STARTER | PRO |
|-------|------|---------|-----|
| Staff members | 1 | 5 | Unlimited |
| Services | 5 | 20 | Unlimited |
| Bookings/month | 50 | 500 | Unlimited |
| Products | 5 | 20 | Unlimited |
| Session packages | 2 | 10 | Unlimited |
| WhatsApp notifications | No | Yes | Yes |
| Custom theme preset | 1 | All | All |
| Remove platform branding | No | No | Yes |

These are starting points — adjustable without code changes via `lib/plans/limits.ts`.

---

## 15. Engineering Principles & Code Organization

This section defines the mandatory code quality standards for the entire codebase.
The goal is a clean, modular, maintainable architecture — not a fast but messy implementation.

### 15.1 Core Principles

#### Component-Based Architecture

All UI is built from small, single-responsibility components. Pages are thin composition layers that orchestrate child components — they do not contain implementation detail.

```
book/[serviceId]/page.tsx         ← data fetching + composition only
├── components/booking/
│   ├── booking-header.tsx        ← renders title, breadcrumb
│   ├── service-picker.tsx        ← service selection UI
│   ├── staff-selector.tsx        ← staff selection UI
│   ├── time-slot-selector.tsx    ← date/time selection UI
│   ├── customer-details-form.tsx ← name/phone form
│   ├── otp-step.tsx              ← OTP verification UI
│   ├── payment-step.tsx          ← Stripe checkout trigger
│   └── booking-confirmation.tsx  ← success state
```

#### Separation of Responsibilities

Every layer has exactly one job. Mixing layers within a single file is not permitted.

| Layer | Location | Responsibility | Never Contains |
|-------|----------|---------------|----------------|
| Pages | `app/**/page.tsx` | Data fetching, composition, layout | Business logic, validation, direct DB calls |
| Components | `components/**` | UI rendering, user interaction | Database queries, business logic |
| Server Actions | `actions/**` | Mutations, orchestration | UI code, complex domain logic |
| Domain Logic | `lib/**` | Business rules, algorithms, integrations | UI code, framework-specific code |
| Schema | `lib/db/schema/**` | Database table definitions | Business logic, queries |
| Validators | `validators/**` | Input validation, form schemas (Zod) | UI code, DB access |
| Types | `types/**` | Shared TypeScript interfaces/types | Implementation logic |
| Utilities | `lib/utils/**` | Pure helper functions | Side effects, DB access |

#### What this means in practice

**Bad** — monolithic page with mixed concerns:
```
book/page.tsx
  → renders UI
  → validates form input
  → computes available slots
  → calls database
  → processes payment
  → sends notifications
```

**Good** — each concern in its own module:
```
book/page.tsx                     → composes components
components/booking/*.tsx          → UI rendering
validators/booking.ts             → Zod schemas for form validation
lib/scheduling/availability.ts    → slot computation algorithm
actions/appointments.ts           → create appointment mutation
lib/payments/stripe.ts            → Stripe checkout session creation
lib/notifications/dispatcher.ts   → send confirmation notification
```

### 15.2 File Size & Complexity Guidelines

| Guideline | Rule |
|-----------|------|
| Component files | Should be scannable — if you can't understand it in 30 seconds, split it |
| Page files | Thin — fetch data, compose components, pass props |
| Action files | One exported function per action, or closely related group |
| Domain modules | One concept per file (e.g., `availability.ts` does not handle payments) |
| Schema files | One entity or closely related entity group per file |
| Index files | Re-exports only — no implementation logic |

If a file grows beyond easy comprehension, split it. Refactor early rather than letting complexity accumulate.

### 15.3 Feature-Based Organization

Complex features use a feature-module pattern when the feature's components are not reused elsewhere. Shared components stay in the top-level `components/` directory.

```
components/
├── ui/                          # shadcn/ui primitives (global)
├── shared/                      # cross-feature components
│   ├── data-table.tsx
│   ├── page-header.tsx
│   ├── empty-state.tsx
│   ├── confirm-dialog.tsx
│   └── image-upload.tsx
├── dashboard/                   # dashboard shell components
│   ├── sidebar.tsx
│   ├── topbar.tsx
│   └── stats-card.tsx
├── booking/                     # booking flow components
│   ├── service-picker.tsx
│   ├── staff-selector.tsx
│   ├── time-slot-selector.tsx
│   ├── customer-details-form.tsx
│   ├── otp-step.tsx
│   ├── payment-step.tsx
│   └── booking-confirmation.tsx
├── marketing/                   # landing page components
├── public-site/                 # public business site sections
│   ├── hero-section.tsx
│   ├── about-section.tsx
│   ├── services-section.tsx
│   ├── team-section.tsx
│   ├── products-section.tsx
│   ├── booking-section.tsx
│   └── contact-section.tsx
└── forms/                       # reusable form components
    ├── service-form.tsx
    ├── staff-form.tsx
    ├── product-form.tsx
    └── schedule-form.tsx
```

### 15.4 Domain Isolation

Critical system domains are isolated behind clean interfaces. Internal implementation details are never leaked to consumers.

```
lib/
├── scheduling/
│   ├── availability.ts          # getAvailableSlots(), getAvailableStaffAndSlots()
│   ├── conflicts.ts             # checkConflict(), validateSlotAvailable()
│   └── types.ts                 # TimeSlot, AvailabilityResult, etc.
│
├── notifications/
│   ├── types.ts                 # NotificationProvider interface
│   ├── dispatcher.ts            # dispatch() — routes to correct provider
│   └── providers/
│       ├── email.ts             # implements NotificationProvider
│       ├── sms.ts               # implements NotificationProvider
│       └── whatsapp.ts          # implements NotificationProvider
│
├── payments/
│   ├── stripe.ts                # createCheckoutSession(), handleWebhook()
│   └── types.ts                 # PaymentResult, CheckoutParams, etc.
│
├── auth/
│   ├── config.ts                # Auth.js configuration
│   ├── providers.ts             # provider setup (credentials, google, otp)
│   └── guards.ts                # requireBusinessOwner(), requireCustomer()
│
├── storage/
│   ├── client.ts                # uploadFile(), getSignedUrl(), deleteFile()
│   └── types.ts                 # UploadResult, StorageConfig
│
├── templates/
│   ├── index.ts                 # getTemplate(businessType)
│   ├── barber.ts                # template data
│   ├── beauty.ts
│   ├── fitness.ts
│   ├── tutor.ts
│   ├── clinic.ts
│   └── generic.ts
│
├── plans/
│   ├── limits.ts                # PLAN_LIMITS constant, getLimitsForPlan()
│   └── gates.ts                 # canAddStaff(), canCreateBooking(), isFeatureEnabled()
│
└── utils/
    ├── constants.ts
    ├── currencies.ts            # SUPPORTED_CURRENCIES, formatPrice()
    └── dates.ts                 # toBusinessTimezone(), formatDate(), etc.
```

Each domain exports only what consumers need. For example, the scheduling domain exposes `getAvailableSlots()` — it never exposes internal calendar-intersection logic.

### 15.5 Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files & directories | kebab-case | `time-slot-selector.tsx`, `site-config.ts` |
| React components | PascalCase | `TimeSlotSelector`, `BookingConfirmation` |
| Functions | camelCase | `getAvailableSlots`, `createAppointment` |
| Server Actions | camelCase, verb-first | `createService`, `updateStaff`, `cancelAppointment` |
| Types & interfaces | PascalCase | `Appointment`, `AvailabilityResult` |
| Enums (Drizzle) | SCREAMING_SNAKE_CASE values | `PENDING`, `CONFIRMED`, `CANCELLED` |
| Constants | SCREAMING_SNAKE_CASE | `PLAN_LIMITS`, `MAX_OTP_ATTEMPTS` |
| Database tables | snake_case (Drizzle convention) | `staff_member`, `service_package` |
| Environment variables | SCREAMING_SNAKE_CASE | `DATABASE_URL`, `STRIPE_SECRET_KEY` |

### 15.6 Server Actions Pattern

Server Actions follow a consistent structure:

```typescript
// actions/appointments.ts

"use server"

import { z } from "zod"
import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db"
import { createAppointmentSchema } from "@/validators/appointments"
import { getAvailableSlots } from "@/lib/scheduling/availability"
import { dispatch } from "@/lib/notifications/dispatcher"

export async function createAppointment(input: z.infer<typeof createAppointmentSchema>) {
  // 1. Authenticate
  // 2. Validate input
  // 3. Authorize (check permissions, plan limits)
  // 4. Execute domain logic (check availability, create record)
  // 5. Side effects (notifications, logging)
  // 6. Return result
}
```

Every action:
- Validates input via Zod schema (defined in `validators/`)
- Checks authentication and authorization
- Delegates complex logic to domain modules in `lib/`
- Returns a typed result — never throws unstructured errors to the client

### 15.7 Data Fetching Pattern

Data fetching uses Server Components with dedicated query functions:

```typescript
// lib/db/queries/appointments.ts

export async function getAppointmentsForBusiness(
  businessId: string,
  filters: AppointmentFilters
) {
  // Single-responsibility query function
  // Used by Server Components in pages
}

export async function getAppointmentDetail(
  businessId: string,
  appointmentId: string
) {
  // ...
}
```

```typescript
// app/(dashboard)/appointments/page.tsx

import { getAppointmentsForBusiness } from "@/lib/db/queries/appointments"
import { AppointmentList } from "@/components/dashboard/appointments/appointment-list"
import { AppointmentFilters } from "@/components/dashboard/appointments/appointment-filters"
import { PageHeader } from "@/components/shared/page-header"

export default async function AppointmentsPage({ searchParams }) {
  const session = await auth()
  const appointments = await getAppointmentsForBusiness(session.businessId, searchParams)

  return (
    <>
      <PageHeader title="Appointments" />
      <AppointmentFilters />
      <AppointmentList appointments={appointments} />
    </>
  )
}
```

Pages stay thin. Query logic lives in `lib/db/queries/`. UI lives in components.

### 15.8 Validation Pattern

All user input is validated with Zod schemas in a dedicated `validators/` directory:

```
validators/
├── auth.ts              # loginSchema, signupSchema, otpSchema
├── business.ts          # createBusinessSchema, updateBusinessSchema
├── staff.ts             # createStaffSchema, staffScheduleSchema
├── services.ts          # createServiceSchema, updateServiceSchema
├── appointments.ts      # createAppointmentSchema, rescheduleSchema
├── customers.ts         # customerNoteSchema, customerTagsSchema
├── products.ts          # createProductSchema, updateProductSchema
└── site-config.ts       # updateSiteConfigSchema, sectionContentSchema
```

Schemas are shared between client-side form validation and server-side action validation.

### 15.9 Error Handling Pattern

Actions return structured results instead of throwing:

```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; field?: string }
```

Components check `result.success` and render appropriate feedback. This keeps error handling explicit and predictable across the entire application.

### 15.10 Implementation Self-Check

When implementing any feature, validate against this checklist:

- [ ] Can this component be split into smaller, focused parts?
- [ ] Does any file have more than one responsibility?
- [ ] Is business logic separated from UI rendering?
- [ ] Are database queries in `lib/db/queries/`, not in components or pages?
- [ ] Is input validation using a Zod schema in `validators/`?
- [ ] Is shared logic extracted into `lib/` rather than duplicated?
- [ ] Would another developer understand this file within 30 seconds?
- [ ] Are naming conventions consistent with section 15.5?
- [ ] Does the page file stay thin (data fetching + composition only)?

If any answer is no, restructure before moving on.
