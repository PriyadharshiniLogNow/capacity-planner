import { generateNextEmployeeCode } from "./employeeCode";
import { prisma } from "./prisma";
import { isPrismaUniqueConstraintError } from "./uniqueConstraint";
import { parseDateOnly } from "../utils/date";

function capitalize(value: string): string {
  if (!value) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Display name for a supervisor login that has no employee profile yet. */
export function supervisorProfileFromEmail(email: string): {
  firstName: string;
  lastName: string;
} {
  const local = email.split("@")[0]?.trim() ?? "";
  const parts = local
    .split(/[._+-]+/)
    .map((part) => capitalize(part))
    .filter(Boolean);

  if (parts.length >= 2) {
    return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
  }

  return { firstName: parts[0] || "Supervisor", lastName: "Supervisor" };
}

function todayDateOnly(): Date {
  const now = new Date();
  const iso = now.toISOString().slice(0, 10);
  return parseDateOnly(iso);
}

/**
 * Supervisor pickers list employees linked to a SUPERVISOR login.
 * Create that profile when the account exists but is not linked yet.
 */
export async function ensureSupervisorUserEmployees(actorId: string): Promise<void> {
  const users = await prisma.user.findMany({
    where: { role: "SUPERVISOR", employeeId: null },
    select: { id: true, email: true },
    orderBy: { email: "asc" },
  });

  for (const user of users) {
    const existing = await prisma.employee.findUnique({
      where: { email: user.email },
      select: { id: true },
    });

    if (existing) {
      const alreadyLinked = await prisma.user.findUnique({
        where: { employeeId: existing.id },
        select: { id: true },
      });
      if (!alreadyLinked) {
        await prisma.user.update({
          where: { id: user.id },
          data: { employeeId: existing.id },
        });
      }
      continue;
    }

    const { firstName, lastName } = supervisorProfileFromEmail(user.email);

    try {
      await prisma.$transaction(async (tx) => {
        const employeeCode = await generateNextEmployeeCode();
        const created = await tx.employee.create({
          data: {
            employeeCode,
            firstName,
            lastName,
            email: user.email,
            role: "Supervisor",
            department: "Management",
            weeklyHours: 40,
            workingDays: [1, 2, 3, 4, 5],
            startDate: todayDateOnly(),
            status: "ACTIVE",
            createdBy: actorId,
            updatedBy: actorId,
          },
        });
        await tx.user.update({
          where: { id: user.id },
          data: { employeeId: created.id },
        });
      });
    } catch (error) {
      if (isPrismaUniqueConstraintError(error)) {
        continue;
      }
      throw error;
    }
  }
}
