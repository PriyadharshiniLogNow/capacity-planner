import { z } from "zod";

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

const plannedHoursSchema = z
  .number()
  .min(0, "plannedHours must be greater than or equal to 0")
  .max(168, "plannedHours must be at most 168");

const dailyHourValueSchema = z
  .number()
  .min(0, "daily hours must be greater than or equal to 0")
  .max(24, "daily hours must be at most 24");

export const dailyHoursSchema = z
  .object({
    "1": dailyHourValueSchema.optional(),
    "2": dailyHourValueSchema.optional(),
    "3": dailyHourValueSchema.optional(),
    "4": dailyHourValueSchema.optional(),
    "5": dailyHourValueSchema.optional(),
    "6": dailyHourValueSchema.optional(),
    "7": dailyHourValueSchema.optional(),
  })
  .optional();

export const createCapacityPlanSchema = z.object({
  employeeId: z.string().trim().min(1, "employeeId is required"),
  projectId: z.string().trim().min(1, "projectId is required"),
  weekStart: dateString,
  plannedHours: plannedHoursSchema,
  dailyHours: dailyHoursSchema,
});

export const updateCapacityPlanSchema = z
  .object({
    projectId: z.string().trim().min(1).optional(),
    weekStart: dateString.optional(),
    plannedHours: plannedHoursSchema.optional(),
    dailyHours: dailyHoursSchema,
  })
  .superRefine((data, ctx) => {
    if (
      data.projectId === undefined &&
      data.weekStart === undefined &&
      data.plannedHours === undefined &&
      data.dailyHours === undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [],
        message: "At least one field must be provided",
      });
    }
  });

export const listCapacityPlansQuerySchema = z.object({
  employeeId: z.string().trim().min(1).optional(),
  projectId: z.string().trim().min(1).optional(),
  weekStart: dateString.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const capacityPlanIdParamSchema = z.object({
  id: z.string().trim().min(1, "id is required"),
});

export const copyWeekSchema = z
  .object({
    sourceWeekStart: dateString,
    targetWeekStart: dateString,
    employeeId: z.string().trim().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.sourceWeekStart === data.targetWeekStart) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targetWeekStart"],
        message: "targetWeekStart must differ from sourceWeekStart",
      });
    }
  });
