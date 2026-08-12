import { z } from "zod";

const dateString = z
  .string()
  .min(1, "Date is required")
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Invalid date",
  })
  .transform((value) => new Date(value));

export const projectBodySchema = z
  .object({
    projectCode: z.string().trim().min(1, "projectCode is required"),
    name: z.string().trim().min(1, "name is required"),
    type: z.enum(["CUSTOMER", "INTERNAL"]),
    customerName: z.string().trim().min(1).nullable().optional(),
    projectManagerId: z.string().trim().min(1).nullable().optional(),
    startDate: dateString,
    endDate: dateString,
    billable: z.boolean(),
    status: z.enum(["OPEN", "CLOSED"]),
  })
  .superRefine((data, ctx) => {
    if (data.type === "CUSTOMER") {
      if (!data.customerName || data.customerName.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["customerName"],
          message: "customerName is required when type is CUSTOMER",
        });
      }
    }

    if (data.endDate < data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "endDate must be greater than or equal to startDate",
      });
    }
  });

export const listProjectsQuerySchema = z.object({
  status: z.enum(["OPEN", "CLOSED"]).optional(),
  type: z.enum(["CUSTOMER", "INTERNAL"]).optional(),
  billable: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  search: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
