import { prisma } from "./prisma";

export const EMPLOYEE_CODE_PREFIX = "EMP";
const EMPLOYEE_CODE_PATTERN = /^EMP-(\d+)$/i;

export function formatEmployeeCode(sequence: number): string {
  return `${EMPLOYEE_CODE_PREFIX}-${String(sequence).padStart(3, "0")}`;
}

export function parseEmployeeCodeSequence(employeeCode: string): number | null {
  const match = employeeCode.trim().match(EMPLOYEE_CODE_PATTERN);
  if (!match) {
    return null;
  }
  const value = Number.parseInt(match[1], 10);
  return Number.isFinite(value) ? value : null;
}

export async function nextEmployeeCodeSequence(): Promise<number> {
  const employees = await prisma.employee.findMany({
    select: { employeeCode: true },
  });

  let max = 0;
  for (const employee of employees) {
    const sequence = parseEmployeeCodeSequence(employee.employeeCode);
    if (sequence !== null) {
      max = Math.max(max, sequence);
    }
  }

  return max + 1;
}

export async function generateNextEmployeeCode(): Promise<string> {
  return formatEmployeeCode(await nextEmployeeCodeSequence());
}
