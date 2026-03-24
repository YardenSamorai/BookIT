import { z } from "zod";

export const staffMemberSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  roleTitle: z.string().max(60).optional().or(z.literal("")),
  bio: z.string().max(500).optional().or(z.literal("")),
  imageUrl: z.string().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export const staffScheduleEntrySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time")
    .transform((v) => v.slice(0, 5)),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time")
    .transform((v) => v.slice(0, 5)),
  isActive: z.boolean(),
});

export const staffScheduleSchema = z.array(staffScheduleEntrySchema).length(7);

export const staffTimeOffSchema = z.object({
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().max(200).optional().or(z.literal("")),
});

export type StaffMemberInput = z.infer<typeof staffMemberSchema>;
export type StaffScheduleInput = z.infer<typeof staffScheduleSchema>;
export type StaffTimeOffInput = z.infer<typeof staffTimeOffSchema>;
