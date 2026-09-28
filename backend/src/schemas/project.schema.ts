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

const projectFieldsSchema = z.object({
  name: z.string().trim().min(1, "Project name is required"),
  type: z.enum(["CUSTOMER", "INTERNAL"]),
  customerName: z.string().trim().min(1, "Customer is required"),
  projectManagerId: z.string().trim().min(1, "Project manager is required"),
  startDate: dateString,
  endDate: dateString,
  billable: z.boolean(),
  status: z.enum(["OPEN", "CLOSED"]),
});

function validateProjectDateRange(
  data: { startDate: string; endDate: string },
  ctx: z.RefinementCtx,
) {
  if (data.endDate < data.startDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endDate"],
      message: "Project end date cannot be earlier than the start date.",
    });
  }
}

function validateProjectCustomerName(
  data: { type: "CUSTOMER" | "INTERNAL"; customerName: string },
  ctx: z.RefinementCtx,
) {
  if (
    data.type === "INTERNAL" &&
    data.customerName !== INTERNAL_CUSTOMER_NAME
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["customerName"],
      message: `Internal projects must use customer "${INTERNAL_CUSTOMER_NAME}".`,
    });
  }
}

function validateProjectFields(
  data: {
    type: "CUSTOMER" | "INTERNAL";
    customerName: string;
    startDate: string;
    endDate: string;
  },
  ctx: z.RefinementCtx,
) {
  validateProjectDateRange(data, ctx);
  validateProjectCustomerName(data, ctx);
}

/** Create: project ID is assigned by the server (e.g. PROJ-001). */
export const createProjectBodySchema =
  projectFieldsSchema.superRefine(validateProjectFields);

export const projectBodySchema = projectFieldsSchema
  .extend({
    projectCode: z.string().trim().min(1, "Project ID is required"),
  })
  .superRefine(validateProjectFields);

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
