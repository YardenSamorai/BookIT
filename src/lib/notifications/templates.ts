import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { messageTemplates } from "@/lib/db/schema";

type TemplateType = "BOOKING_CONFIRMED" | "REMINDER" | "CANCELLATION" | "RESCHEDULE";
type TemplateChannel = "WHATSAPP" | "SMS";

interface DefaultTemplate {
  type: TemplateType;
  channel: TemplateChannel;
  body_en: string;
  body_he: string;
}

const DEFAULT_TEMPLATES: DefaultTemplate[] = [
  {
    type: "BOOKING_CONFIRMED",
    channel: "WHATSAPP",
    body_en:
      "Hi {customerName}! Your appointment at {businessName} has been confirmed.\n\n📅 {date} at {time}\n💇 {service}\n👤 {staff}\n\nSee you there!",
    body_he:
      "היי {customerName}! התור שלך ב-{businessName} אושר.\n\n📅 {date} בשעה {time}\n💇 {service}\n👤 {staff}\n\nנתראה!",
  },
  {
    type: "BOOKING_CONFIRMED",
    channel: "SMS",
    body_en:
      "Hi {customerName}! Your appointment at {businessName} is confirmed for {date} at {time}. Service: {service}.",
    body_he:
      "היי {customerName}! התור שלך ב-{businessName} אושר ל-{date} בשעה {time}. שירות: {service}.",
  },
  {
    type: "REMINDER",
    channel: "WHATSAPP",
    body_en:
      "⏰ Reminder: {customerName}, your appointment at {businessName} is coming up!\n\n📅 {date} at {time}\n💇 {service}\n👤 {staff}\n\nDon't forget!",
    body_he:
      "⏰ תזכורת: {customerName}, התור שלך ב-{businessName} מתקרב!\n\n📅 {date} בשעה {time}\n💇 {service}\n👤 {staff}\n\nאל תשכח/י!",
  },
  {
    type: "REMINDER",
    channel: "SMS",
    body_en:
      "Reminder: {customerName}, your appointment at {businessName} is on {date} at {time}. Service: {service}.",
    body_he:
      "תזכורת: {customerName}, התור שלך ב-{businessName} ב-{date} בשעה {time}. שירות: {service}.",
  },
  {
    type: "CANCELLATION",
    channel: "WHATSAPP",
    body_en:
      "Hi {customerName}, your appointment at {businessName} on {date} at {time} has been cancelled.\n\n💇 {service}\n\nWe hope to see you again soon!",
    body_he:
      "היי {customerName}, התור שלך ב-{businessName} ב-{date} בשעה {time} בוטל.\n\n💇 {service}\n\nנשמח לראותך שוב!",
  },
  {
    type: "CANCELLATION",
    channel: "SMS",
    body_en:
      "{customerName}, your appointment at {businessName} on {date} at {time} has been cancelled.",
    body_he:
      "{customerName}, התור שלך ב-{businessName} ב-{date} בשעה {time} בוטל.",
  },
  {
    type: "RESCHEDULE",
    channel: "WHATSAPP",
    body_en:
      "Hi {customerName}! Your appointment at {businessName} has been rescheduled.\n\n📅 New time: {date} at {time}\n💇 {service}\n👤 {staff}\n\nSee you then!",
    body_he:
      "היי {customerName}! התור שלך ב-{businessName} שונה.\n\n📅 מועד חדש: {date} בשעה {time}\n💇 {service}\n👤 {staff}\n\nנתראה!",
  },
  {
    type: "RESCHEDULE",
    channel: "SMS",
    body_en:
      "{customerName}, your appointment at {businessName} has been rescheduled to {date} at {time}. Service: {service}.",
    body_he:
      "{customerName}, התור שלך ב-{businessName} שונה ל-{date} בשעה {time}. שירות: {service}.",
  },
];

export const TEMPLATE_PLACEHOLDERS = [
  "{customerName}",
  "{businessName}",
  "{date}",
  "{time}",
  "{service}",
  "{staff}",
] as const;

export function getDefaultTemplateBody(
  type: TemplateType,
  channel: TemplateChannel,
  locale: "en" | "he" = "he"
): string {
  const tmpl = DEFAULT_TEMPLATES.find(
    (t) => t.type === type && t.channel === channel
  );
  if (!tmpl) return "";
  return locale === "he" ? tmpl.body_he : tmpl.body_en;
}

export async function getOrCreateTemplates(businessId: string, locale: "en" | "he" = "he") {
  const existing = await db
    .select()
    .from(messageTemplates)
    .where(eq(messageTemplates.businessId, businessId));

  if (existing.length > 0) return existing;

  const toInsert = DEFAULT_TEMPLATES.map((tmpl) => ({
    businessId,
    type: tmpl.type as "BOOKING_CONFIRMED" | "REMINDER" | "CANCELLATION" | "RESCHEDULE" | "OTP" | "MANUAL",
    channel: tmpl.channel as "EMAIL" | "WHATSAPP" | "SMS",
    body: locale === "he" ? tmpl.body_he : tmpl.body_en,
    isActive: true,
  }));

  await db.insert(messageTemplates).values(toInsert);

  return db
    .select()
    .from(messageTemplates)
    .where(eq(messageTemplates.businessId, businessId));
}

export function renderTemplate(
  body: string,
  variables: Record<string, string>
): string {
  let rendered = body;
  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replaceAll(`{${key}}`, value);
  }
  return rendered;
}

export async function getTemplateForNotification(
  businessId: string,
  type: TemplateType,
  channel: TemplateChannel,
  locale: "en" | "he" = "he"
): Promise<string> {
  const tmpl = await db.query.messageTemplates.findFirst({
    where: and(
      eq(messageTemplates.businessId, businessId),
      eq(messageTemplates.type, type),
      eq(messageTemplates.channel, channel),
      eq(messageTemplates.isActive, true)
    ),
  });

  if (tmpl) return tmpl.body;
  return getDefaultTemplateBody(type, channel, locale);
}
