import { z } from "zod";

export const cardTemplateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().max(500).optional(),
  sessionCount: z.coerce.number().int().min(2, "Minimum 2 sessions").max(200, "Maximum 200 sessions"),
  price: z.string().min(1, "Price is required"),
  expirationDays: z.coerce.number().int().min(0).optional(),
  serviceIds: z.array(z.string().uuid()).min(1, "Select at least one service"),
  isActive: z.boolean().default(true),
  isPurchasable: z.boolean().default(false),
  restoreOnLateCancel: z.boolean().default(false),
  restoreOnNoShow: z.boolean().default(false),
  displayOrder: z.coerce.number().int().min(0).default(0),
});

export type CardTemplateInput = z.infer<typeof cardTemplateSchema>;

export const assignCardSchema = z.object({
  customerId: z.string().uuid("Customer is required"),
  cardTemplateId: z.string().uuid("Card template is required"),
  paymentStatus: z.enum(["PAID", "PENDING"]),
  paymentMethod: z.enum(["CASH", "TRANSFER", "STRIPE", "ON_SITE", "OTHER"]),
  notes: z.string().max(500).optional(),
});

export type AssignCardInput = z.infer<typeof assignCardSchema>;

export const adjustCardSessionsSchema = z.object({
  customerCardId: z.string().uuid(),
  delta: z.coerce.number().int().min(-100).max(100).refine((v) => v !== 0, "Delta cannot be zero"),
  notes: z.string().min(1, "Reason is required").max(500),
});

export type AdjustCardSessionsInput = z.infer<typeof adjustCardSessionsSchema>;
