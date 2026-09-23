import { describe, expect, it } from "vitest";
import {
  createEmployeeSchema,
  listEmployeesQuerySchema,
  updateEmployeeSchema,
} from "../src/schemas/employee.schema";
import { loginSchema, registerSchema } from "../src/schemas/auth.schema";

const validEmployee = {
  employeeCode: " EMP-100 ",
  firstName: " Jamie ",
  lastName: " Rivera ",
  email: "jamie@capacity.local",
  role: "Consultant",
  department: "Delivery",
  weeklyHours: 40,
  workingDays: [1, 2, 3, 4, 5],
  startDate: "2026-01-05",
  endDate: null,
  status: "ACTIVE" as const,
  supervisorId: "sup_1",
};

describe("createEmployeeSchema", () => {
  it("creates an employee with valid data and trims Employee ID and names", () => {
    const parsed = createEmployeeSchema.parse(validEmployee);
    expect(parsed.employeeCode).toBe("EMP-100");
    expect(parsed.firstName).toBe("Jamie");
    expect(parsed.lastName).toBe("Rivera");
    expect(parsed.email).toBe("jamie@capacity.local");
    expect(parsed.weeklyHours).toBe(40);
    expect(parsed.supervisorId).toBe("sup_1");
  });

  it("accepts employee creation without a password and does not store one", () => {
    const parsed = createEmployeeSchema.parse({
      ...validEmployee,
      password: "should-not-be-required",
    });
    expect(parsed).not.toHaveProperty("password");
    expect("password" in parsed).toBe(false);
  });

  it("keeps Employee ID and email as separate fields", () => {
    const parsed = createEmployeeSchema.parse(validEmployee);
    expect(parsed.employeeCode).toBe("EMP-100");
    expect(parsed.email).toBe("jamie@capacity.local");
    expect(parsed.employeeCode).not.toBe(parsed.email);
  });

  it("rejects an employee without required fields", () => {
    const parsed = createEmployeeSchema.safeParse({});
    expect(parsed.success).toBe(false);
    if (parsed.success) {
      return;
    }
    const fields = parsed.error.flatten().fieldErrors;
    expect(fields.employeeCode?.length).toBeGreaterThan(0);
    expect(fields.firstName?.length).toBeGreaterThan(0);
    expect(fields.lastName?.length).toBeGreaterThan(0);
    expect(fields.email?.length).toBeGreaterThan(0);
    expect(fields.role?.length).toBeGreaterThan(0);
    expect(fields.department?.length).toBeGreaterThan(0);
    expect(fields.startDate?.length).toBeGreaterThan(0);
    expect(fields.status?.length).toBeGreaterThan(0);
  });

  it("rejects an invalid email", () => {
    const parsed = createEmployeeSchema.safeParse({
      ...validEmployee,
      email: "not-an-email",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects weekly contract hours of zero", () => {
    const parsed = createEmployeeSchema.safeParse({
      ...validEmployee,
      weeklyHours: 0,
    });
    expect(parsed.success).toBe(false);
    if (parsed.success) {
      return;
    }
    expect(parsed.error.flatten().fieldErrors.weeklyHours).toContain(
      "Weekly contract hours must be greater than zero.",
    );
  });

  it("rejects negative weekly contract hours", () => {
    const parsed = createEmployeeSchema.safeParse({
      ...validEmployee,
      weeklyHours: -8,
    });
    expect(parsed.success).toBe(false);
    if (parsed.success) {
      return;
    }
    expect(parsed.error.flatten().fieldErrors.weeklyHours).toContain(
      "Weekly contract hours must be greater than zero.",
    );
  });

  it("rejects an end date earlier than the start date", () => {
    const parsed = createEmployeeSchema.safeParse({
      ...validEmployee,
      startDate: "2026-03-01",
      endDate: "2026-02-01",
    });
    expect(parsed.success).toBe(false);
    if (parsed.success) {
      return;
    }
    expect(parsed.error.flatten().fieldErrors.endDate).toContain(
      "End date cannot be earlier than the start date.",
    );
  });

  it("allows a missing end date", () => {
    const parsed = createEmployeeSchema.parse({
      ...validEmployee,
      endDate: undefined,
    });
    expect(parsed.endDate).toBeUndefined();
  });

  it("allows an empty supervisor for the first-employee bootstrap", () => {
    const parsed = createEmployeeSchema.parse({
      ...validEmployee,
      supervisorId: "",
    });
    expect(parsed.supervisorId).toBeNull();
  });
});

describe("updateEmployeeSchema", () => {
  it("updates employee master data without a password property", () => {
    const parsed = updateEmployeeSchema.parse(validEmployee);
    expect(parsed).not.toHaveProperty("password");
    expect(parsed.supervisorId).toBe("sup_1");
    expect(parsed.email).toBe("jamie@capacity.local");
  });
});

describe("listEmployeesQuerySchema", () => {
  it("does not default to active-only, so inactive employees remain listable", () => {
    const parsed = listEmployeesQuerySchema.parse({});
    expect(parsed.status).toBeUndefined();
  });
});

describe("auth schemas stay separate from employee master data", () => {
  it("still requires a password to log in", () => {
    const parsed = loginSchema.parse({
      email: "jamie@capacity.local",
      password: "employee123",
    });
    expect(parsed.password).toBe("employee123");
  });

  it("still requires a password to register a user account", () => {
    const parsed = registerSchema.parse({
      email: "admin@capacity.local",
      password: "admin1234",
      role: "ADMIN",
    });
    expect(parsed.password).toBe("admin1234");
  });
});
