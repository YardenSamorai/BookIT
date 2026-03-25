import { z } from "zod";

export const serviceCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(60),
});

export const serviceSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(80),
  description: z.string().max(500).optional().or(z.literal("")),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  durationMinutes: z.coerce.number().int().min(5).max(480),
  bufferMinutes: z.coerce.number().int().min(0).max(120).optional(),
  price: z.string().optional().or(z.literal("")),
  depositAmount: z.string().optional().or(z.literal("")),
  paymentMode: z.enum(["FULL", "DEPOSIT", "ON_SITE", "CONTACT_FOR_PRICE", "FREE"]),
  approvalType: z.enum(["AUTO", "MANUAL"]),
  staffAssignmentMode: z.enum(["SPECIFIC", "LIST", "ANY"]),
  imageUrl: z.string().optional().or(z.literal("")),
  meetingLink: z.string().url().optional().or(z.literal("")),
  isGroup: z.boolean().default(false),
  maxParticipants: z.coerce.number().int().min(1).max(500).default(1),
  blocksAllStaff: z.boolean().default(false),
  autoManaged: z.boolean().default(false),
  cancelHoursBefore: z.coerce.number().int().min(0).optional(),
  rescheduleHoursBefore: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().default(true),
});

export const servicePackageSchema = z.object({
  serviceId: z.string().uuid("Service is required"),
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  sessionCount: z.coerce.number().int().min(2).max(100),
  price: z.string().min(1, "Price is required"),
  expirationDays: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().default(true),
});

export type ServiceCategoryInput = z.infer<typeof serviceCategorySchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
export type ServicePackageInput = z.infer<typeof servicePackageSchema>;
