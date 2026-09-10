import { z } from "zod";
import { EmployeeStatus } from "@prisma/client";
import { emailSchema } from "./auth.schema";

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
  .refine((value) => {
    const [y, m, d] = value.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return (
      dt.getUTCFullYear() === y &&
      dt.getUTCMonth() === m - 1 &&
      dt.getUTCDate() === d
    );
  }, "Invalid calendar date");

const workingDaysSchema = z
  .array(z.number().int().min(1).max(7))
  .min(1, "Working days is required")
  .refine(
    (days) => new Set(days).size === days.length,
    "workingDays values must be unique",
  );

const supervisorIdSchema = z.preprocess(
  (value) => (value === "" || value === undefined ? null : value),
  z.string().trim().min(1).nullable(),
);

export const employeeProfileSchema = z
  .object({
    employeeCode: z.string().trim().min(1, "Employee ID is required"),
    firstName: z.string().trim().min(1, "First name is required"),
    lastName: z.string().trim().min(1, "Last name is required"),
    email: emailSchema,
    role: z.string().trim().min(1, "Role is required"),
    department: z.string().trim().min(1, "Department is required"),
    weeklyHours: z
      .number()
      .positive("Weekly contract hours must be greater than zero."),
    workingDays: workingDaysSchema,
    startDate: dateString,
    endDate: dateString.optional().nullable(),
    status: z.nativeEnum(EmployeeStatus),
    supervisorId: supervisorIdSchema,
  })
  .superRefine((data, ctx) => {
    if (data.endDate && data.endDate < data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date cannot be earlier than the start date.",
      });
    }
  });

export const createEmployeeSchema = employeeProfileSchema;
export const updateEmployeeSchema = employeeProfileSchema;

export const listEmployeesQuerySchema = z.object({
  status: z.nativeEnum(EmployeeStatus).optional(),
  department: z.string().trim().min(1).optional(),
  search: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
