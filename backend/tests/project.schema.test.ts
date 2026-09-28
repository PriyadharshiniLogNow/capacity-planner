import { describe, expect, it } from "vitest";
import {
  createProjectBodySchema,
  INTERNAL_CUSTOMER_NAME,
  listProjectsQuerySchema,
  projectBodySchema,
} from "../src/schemas/project.schema";

const validProject = {
  projectCode: " PRJ-100 ",
  name: " Capacity Rollout ",
  type: "INTERNAL" as const,
  customerName: INTERNAL_CUSTOMER_NAME,
  projectManagerId: "emp_1",
  startDate: "2026-01-01",
  endDate: "2026-12-31",
  billable: false,
  status: "OPEN" as const,
};

describe("createProjectBodySchema", () => {
  it("accepts create payloads without a project ID", () => {
    const { projectCode: _ignored, ...createPayload } = validProject;
    const parsed = createProjectBodySchema.parse(createPayload);
    expect(parsed.name).toBe("Capacity Rollout");
    expect("projectCode" in parsed).toBe(false);
  });

  it("rejects create payloads missing required fields", () => {
    const parsed = createProjectBodySchema.safeParse({});
    expect(parsed.success).toBe(false);
    if (parsed.success) {
      return;
    }
    const fields = parsed.error.flatten().fieldErrors;
    expect(fields.projectCode).toBeUndefined();
    expect(fields.name?.length).toBeGreaterThan(0);
  });

  it("rejects internal projects with a customer other than Log Now", () => {
    const { projectCode: _ignored, ...createPayload } = validProject;
    const parsed = createProjectBodySchema.safeParse({
      ...createPayload,
      customerName: "Other Corp",
    });
    expect(parsed.success).toBe(false);
    if (parsed.success) {
      return;
    }
    expect(parsed.error.flatten().fieldErrors.customerName).toContain(
      'Internal projects must use customer "Log Now".',
    );
  });
});

describe("projectBodySchema", () => {
  it("creates a project with valid data and trims Project ID", () => {
    const parsed = projectBodySchema.parse(validProject);
    expect(parsed.projectCode).toBe("PRJ-100");
    expect(parsed.name).toBe("Capacity Rollout");
    expect(parsed.customerName).toBe("Log Now");
    expect(parsed.billable).toBe(false);
    expect(parsed.projectManagerId).toBe("emp_1");
  });

  it("rejects a project without required fields", () => {
    const parsed = projectBodySchema.safeParse({});
    expect(parsed.success).toBe(false);
    if (parsed.success) {
      return;
    }
    const fields = parsed.error.flatten().fieldErrors;
    expect(fields.projectCode?.length).toBeGreaterThan(0);
    expect(fields.name?.length).toBeGreaterThan(0);
    expect(fields.type?.length).toBeGreaterThan(0);
    expect(fields.customerName?.length).toBeGreaterThan(0);
    expect(fields.projectManagerId?.length).toBeGreaterThan(0);
    expect(fields.startDate?.length).toBeGreaterThan(0);
    expect(fields.endDate?.length).toBeGreaterThan(0);
    expect(fields.status?.length).toBeGreaterThan(0);
  });

  it("rejects a project end date earlier than the start date", () => {
    const parsed = projectBodySchema.safeParse({
      ...validProject,
      startDate: "2026-06-01",
      endDate: "2026-05-01",
    });
    expect(parsed.success).toBe(false);
    if (parsed.success) {
      return;
    }
    expect(parsed.error.flatten().fieldErrors.endDate).toContain(
      "Project end date cannot be earlier than the start date.",
    );
  });

  it("allows customer projects with any customer name", () => {
    const parsed = projectBodySchema.parse({
      ...validProject,
      type: "CUSTOMER",
      customerName: "Global Retail Inc.",
      billable: true,
    });
    expect(parsed.customerName).toBe("Global Retail Inc.");
  });
});

describe("listProjectsQuerySchema", () => {
  it("does not default to open-only, so closed projects remain listable", () => {
    const parsed = listProjectsQuerySchema.parse({});
    expect(parsed.status).toBeUndefined();
  });
});
