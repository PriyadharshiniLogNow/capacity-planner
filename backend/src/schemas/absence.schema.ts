import { AbsenceType } from "@prisma/client";
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

const noteSchema = z
  .string()
  .trim()
  .max(1000, "note must be at most 1000 characters")
  .optional()
  .nullable();

const absenceTypeSchema = z.nativeEnum(AbsenceType, {
  message: "absenceType must be VACATION, SICKNESS, PUBLIC_HOLIDAY, or OTHER",
});

export const createAbsenceSchema = z
  .object({
    employeeId: z.string().trim().min(1, "employeeId is required"),
    startDate: dateString,
    endDate: dateString,
    absenceType: absenceTypeSchema,
    note: noteSchema,
  })
  .superRefine((data, ctx) => {
    if (data.endDate < data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "endDate must be greater than or equal to startDate",
      });
    }
  });

export const updateAbsenceSchema = z
  .object({
    startDate: dateString.optional(),
    endDate: dateString.optional(),
    absenceType: absenceTypeSchema.optional(),
    note: noteSchema,
  })
  .superRefine((data, ctx) => {
    if (
      data.startDate !== undefined &&
      data.endDate !== undefined &&
      data.endDate < data.startDate
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "endDate must be greater than or equal to startDate",
      });
    }

    if (
      data.startDate === undefined &&
      data.endDate === undefined &&
      data.absenceType === undefined &&
      data.note === undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [],
        message: "At least one field must be provided",
      });
    }
  });

export const listAbsencesQuerySchema = z
  .object({
    employeeId: z.string().trim().min(1).optional(),
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

export const absenceIdParamSchema = z.object({
  id: z.string().trim().min(1, "id is required"),
});
