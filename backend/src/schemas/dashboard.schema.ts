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

export const dashboardQuerySchema = z.object({
  weekStart: dateString.optional(),
  employeeId: z.string().trim().min(1).optional(),
  projectId: z.string().trim().min(1).optional(),
});
