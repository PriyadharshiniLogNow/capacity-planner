import { z } from "zod";

export const INTERNAL_CUSTOMER_NAME = "Log Now";

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

export const projectBodySchema = z
  .object({
    projectCode: z.string().trim().min(1, "Project ID is required"),
    name: z.string().trim().min(1, "Project name is required"),
    type: z.enum(["CUSTOMER", "INTERNAL"]),
    customerName: z.string().trim().min(1, "Customer is required"),
    projectManagerId: z.string().trim().min(1, "Project manager is required"),
    startDate: dateString,
    endDate: dateString,
    billable: z.boolean(),
    status: z.enum(["OPEN", "CLOSED"]),
  })
  .superRefine((data, ctx) => {
    if (data.endDate < data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "Project end date cannot be earlier than the start date.",
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
