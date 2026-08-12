import { z } from "zod";
import { EmployeeStatus } from "@prisma/client";

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
  .min(1, "workingDays must be a non-empty array")
  .refine(
    (days) => new Set(days).size === days.length,
    "workingDays values must be unique",
  );

const employeeBodySchema = z
  .object({
    employeeCode: z.string().trim().min(1, "employeeCode is required"),
    firstName: z.string().trim().min(1, "firstName is required"),
    lastName: z.string().trim().min(1, "lastName is required"),
    role: z.string().trim().min(1, "role is required"),
    department: z.string().trim().min(1, "department is required"),
    weeklyHours: z.number().positive("weeklyHours must be greater than 0"),
    workingDays: workingDaysSchema,
    startDate: dateString,
    endDate: dateString.optional().nullable(),
    status: z.nativeEnum(EmployeeStatus),
    managerId: z.string().trim().min(1).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.endDate && data.endDate < data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "endDate must be greater than or equal to startDate",
      });
    }
  });

export const createEmployeeSchema = employeeBodySchema;
export const updateEmployeeSchema = employeeBodySchema;

export const listEmployeesQuerySchema = z.object({
  status: z.nativeEnum(EmployeeStatus).optional(),
  department: z.string().trim().min(1).optional(),
  search: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
