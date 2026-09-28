import { prisma } from "./prisma";

export const PROJECT_CODE_PREFIX = "PROJ";
const PROJECT_CODE_PATTERN = /^PROJ-(\d+)$/i;

export function formatProjectCode(sequence: number): string {
  return `${PROJECT_CODE_PREFIX}-${String(sequence).padStart(3, "0")}`;
}

export function parseProjectCodeSequence(projectCode: string): number | null {
  const match = projectCode.trim().match(PROJECT_CODE_PATTERN);
  if (!match) {
    return null;
  }
  const value = Number.parseInt(match[1], 10);
  return Number.isFinite(value) ? value : null;
}

export async function nextProjectCodeSequence(): Promise<number> {
  const projects = await prisma.project.findMany({
    select: { projectCode: true },
  });

  let max = 0;
  for (const project of projects) {
    const sequence = parseProjectCodeSequence(project.projectCode);
    if (sequence !== null) {
      max = Math.max(max, sequence);
    }
  }

  return max + 1;
}

export async function generateNextProjectCode(): Promise<string> {
  return formatProjectCode(await nextProjectCodeSequence());
}
