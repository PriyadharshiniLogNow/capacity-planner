import { TimeCategory } from "@prisma/client";
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

const commentSchema = z
  .string()
  .trim()
  .max(1000, "comment must be at most 1000 characters")
  .optional()
  .nullable();

const timeCategorySchema = z.nativeEnum(TimeCategory, {
  message:
    "timeCategory must be EXTERNAL_BILLABLE, EXTERNAL_NON_BILLABLE, INTERNAL, or ADMINISTRATION",
});

const actualHoursSchema = z
  .number()
  .positive("actualHours must be greater than 0")
  .max(24, "actualHours must be at most 24");

export const createTimeEntrySchema = z.object({
  employeeId: z.string().trim().min(1, "employeeId is required"),
  projectId: z.string().trim().min(1, "projectId is required"),
  entryDate: dateString,
  actualHours: actualHoursSchema,
  timeCategory: timeCategorySchema,
  comment: commentSchema,
});

export const updateTimeEntrySchema = z
  .object({
    projectId: z.string().trim().min(1).optional(),
    entryDate: dateString.optional(),
    actualHours: actualHoursSchema.optional(),
    timeCategory: timeCategorySchema.optional(),
    comment: commentSchema,
  })
  .superRefine((data, ctx) => {
    if (
      data.projectId === undefined &&
      data.entryDate === undefined &&
      data.actualHours === undefined &&
      data.timeCategory === undefined &&
      data.comment === undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [],
        message: "At least one field must be provided",
      });
    }
  });

export const listTimeEntriesQuerySchema = z
  .object({
    employeeId: z.string().trim().min(1).optional(),
    projectId: z.string().trim().min(1).optional(),
    from: dateString.optional(),
    to: dateString.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .superRefine((data, ctx) => {
    if (data.from && data.to && data.to < data.from) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["to"],
        message: "to must be greater than or equal to from",
      });
    }
  });

export const timeEntryIdParamSchema = z.object({
  id: z.string().trim().min(1, "id is required"),
});
