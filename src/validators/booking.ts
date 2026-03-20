import { z } from "zod";

export const bookingSchema = z.object({
  serviceId: z.string().uuid(),
  staffId: z.string().uuid(),
  startTime: z.string().datetime(),
  notes: z.string().max(500).optional().or(z.literal("")),
  classInstanceId: z.string().uuid().optional(),
});

export type BookingInput = z.infer<typeof bookingSchema>;
