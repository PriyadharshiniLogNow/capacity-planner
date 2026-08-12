import { z } from "zod";
import { Role } from "@prisma/client";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export const emailSchema = z
  .string()
  .trim()
  .min(1, "email is required")
  .email("Invalid email")
  .transform(normalizeEmail);

export const passwordSchema = z
  .string()
  .min(8, "password must be at least 8 characters")
  .max(128, "password must be at most 128 characters");

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  role: z.nativeEnum(Role),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "password is required"),
});
