import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
});

export const otpSendSchema = z.object({
  phone: z
    .string()
    .min(9, "Phone number is too short")
    .max(15, "Phone number is too long")
    .regex(/^(\+?\d{9,15}|0\d{8,10})$/, "Invalid phone number format"),
});

export const otpVerifySchema = z.object({
  phone: z
    .string()
    .min(10, "Phone number is too short")
    .max(15, "Phone number is too long"),
  code: z
    .string()
    .length(6, "OTP code must be 6 digits")
    .regex(/^\d{6}$/, "OTP code must be numeric"),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100)
    .optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type OtpSendInput = z.infer<typeof otpSendSchema>;
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
