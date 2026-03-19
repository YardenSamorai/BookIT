import { z } from "zod";
import { BUSINESS_TYPES } from "@/lib/utils/constants";

export const businessInfoSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  type: z.enum(BUSINESS_TYPES),
  phone: z.string().max(50).optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  timezone: z.string().min(1, "Timezone is required"),
  currency: z.string().min(3).max(3),
  slotGranularityMin: z.coerce.number().int().min(5).max(120),
  defaultBufferMin: z.coerce.number().int().min(0).max(60),
  language: z.enum(["en", "he"]).optional(),
});

export const businessHoursEntrySchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time format").transform((v) => v.slice(0, 5)),
    endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time format").transform((v) => v.slice(0, 5)),
    isOpen: z.boolean(),
  })
  .refine(
    (e) => !e.isOpen || e.startTime < e.endTime,
    { message: "End time must be after start time", path: ["endTime"] }
  );

export const businessHoursSchema = z.array(businessHoursEntrySchema).length(7);

export type BusinessInfoInput = z.infer<typeof businessInfoSchema>;
export type BusinessHoursInput = z.infer<typeof businessHoursSchema>;
