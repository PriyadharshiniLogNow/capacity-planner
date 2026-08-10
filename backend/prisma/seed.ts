import { PrismaClient, RoleName, EmployeeStatus, ProjectStatus, ProjectType } from "@prisma/client";
import { createHash } from "crypto";

/**
 * Seed passwords are hashed with a placeholder until auth (bcrypt) lands in Phase 3.
 * Replace with bcrypt hashes when authentication is implemented.
 */
function placeholderHash(password: string): string {
  return createHash("sha256").update(`capacity-planner:${password}`).digest("hex");
}

const prisma = new PrismaClient();

async function main() {
  const systemUser = "seed";

  const roles = await Promise.all(
    [
      { name: RoleName.ADMIN_PLANNER, description: "Admin / Planner — full maintain access" },
      { name: RoleName.EMPLOYEE, description: "Employee — own plan and time" },
      { name: RoleName.MANAGEMENT, description: "Management / Consulting Director — read-only dashboards" },
    ].map((role) =>
      prisma.role.upsert({
        where: { name: role.name },
        update: { description: role.description },
        create: role,
      })
    )
  );

  const roleByName = Object.fromEntries(roles.map((r) => [r.name, r])) as Record<
    RoleName,
    (typeof roles)[number]
  >;

  const calendar = await prisma.workCalendar.upsert({
    where: { name: "Default" },
    update: {
      workingDays: [1, 2, 3, 4, 5],
      standardHoursPerDay: 8,
    },
    create: {
      name: "Default",
      workingDays: [1, 2, 3, 4, 5],
      standardHoursPerDay: 8,
    },
  });

  const holidaySpecs = [
    { holidayDate: new Date("2026-01-01"), name: "New Year's Day" },
    { holidayDate: new Date("2026-12-25"), name: "Christmas Day" },
  ];

  for (const holiday of holidaySpecs) {
    await prisma.publicHoliday.upsert({
      where: {
        calendarId_holidayDate: {
          calendarId: calendar.id,
          holidayDate: holiday.holidayDate,
        },
      },
      update: { name: holiday.name },
      create: {
        calendarId: calendar.id,
        holidayDate: holiday.holidayDate,
        name: holiday.name,
      },
    });
  }

  const manager = await prisma.employee.upsert({
    where: { employeeCode: "E001" },
    update: {},
    create: {
      employeeCode: "E001",
      firstName: "Alex",
      lastName: "Manager",
      role: "Consulting Manager",
      department: "Consulting",
      weeklyHours: 40,
      workingDays: [1, 2, 3, 4, 5],
      startDate: new Date("2024-01-01"),
      status: EmployeeStatus.ACTIVE,
      createdBy: systemUser,
      updatedBy: systemUser,
    },
  });

  const consultant = await prisma.employee.upsert({
    where: { employeeCode: "E002" },
    update: {},
    create: {
      employeeCode: "E002",
      firstName: "Jamie",
      lastName: "Consultant",
      role: "Consultant",
      department: "Consulting",
      managerId: manager.id,
      weeklyHours: 40,
      workingDays: [1, 2, 3, 4, 5],
      startDate: new Date("2024-06-01"),
      status: EmployeeStatus.ACTIVE,
      createdBy: systemUser,
      updatedBy: systemUser,
    },
  });

  await prisma.project.upsert({
    where: { projectCode: "PRJ-CUST-001" },
    update: {},
    create: {
      projectCode: "PRJ-CUST-001",
      name: "Customer Delivery",
      type: ProjectType.CUSTOMER,
      customerName: "Acme Corp",
      projectManagerId: manager.id,
      startDate: new Date("2025-01-01"),
      endDate: new Date("2026-12-31"),
      billable: true,
      status: ProjectStatus.OPEN,
      createdBy: systemUser,
      updatedBy: systemUser,
    },
  });

  await prisma.project.upsert({
    where: { projectCode: "PRJ-INT-001" },
    update: {},
    create: {
      projectCode: "PRJ-INT-001",
      name: "Internal Enablement",
      type: ProjectType.INTERNAL,
      customerName: null,
      projectManagerId: manager.id,
      startDate: new Date("2025-01-01"),
      endDate: new Date("2026-12-31"),
      billable: false,
      status: ProjectStatus.OPEN,
      createdBy: systemUser,
      updatedBy: systemUser,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@capacity.local" },
    update: {
      passwordHash: placeholderHash("admin123"),
      displayName: "Admin Planner",
    },
    create: {
      email: "admin@capacity.local",
      passwordHash: placeholderHash("admin123"),
      displayName: "Admin Planner",
    },
  });

  const managementUser = await prisma.user.upsert({
    where: { email: "director@capacity.local" },
    update: {
      passwordHash: placeholderHash("director123"),
      displayName: "Consulting Director",
      employeeId: manager.id,
    },
    create: {
      email: "director@capacity.local",
      passwordHash: placeholderHash("director123"),
      displayName: "Consulting Director",
      employeeId: manager.id,
    },
  });

  const employeeUser = await prisma.user.upsert({
    where: { email: "jamie@capacity.local" },
    update: {
      passwordHash: placeholderHash("employee123"),
      displayName: "Jamie Consultant",
      employeeId: consultant.id,
    },
    create: {
      email: "jamie@capacity.local",
      passwordHash: placeholderHash("employee123"),
      displayName: "Jamie Consultant",
      employeeId: consultant.id,
    },
  });

  async function ensureRole(userId: string, roleName: RoleName) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId,
          roleId: roleByName[roleName].id,
        },
      },
      update: {},
      create: {
        userId,
        roleId: roleByName[roleName].id,
      },
    });
  }

  await ensureRole(adminUser.id, RoleName.ADMIN_PLANNER);
  await ensureRole(managementUser.id, RoleName.MANAGEMENT);
  await ensureRole(managementUser.id, RoleName.ADMIN_PLANNER);
  await ensureRole(employeeUser.id, RoleName.EMPLOYEE);

  console.log("Seed complete:");
  console.log("  admin@capacity.local / admin123 (ADMIN_PLANNER)");
  console.log("  director@capacity.local / director123 (MANAGEMENT + ADMIN_PLANNER)");
  console.log("  jamie@capacity.local / employee123 (EMPLOYEE)");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
