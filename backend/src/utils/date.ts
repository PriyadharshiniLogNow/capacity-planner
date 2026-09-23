/** Parse YYYY-MM-DD into a UTC Date suitable for Prisma @db.Date. */
export function parseDateOnly(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Format a Date (or date-like) as YYYY-MM-DD. */
export function formatDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function dateInRange(date: Date, start: Date, end: Date): boolean {
  const t = date.getTime();
  return t >= start.getTime() && t <= end.getTime();
}

export function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart.getTime() <= bEnd.getTime() && bStart.getTime() <= aEnd.getTime();
}

export function isWithinEmploymentPeriod(
  employee: { startDate: Date; endDate: Date | null },
  date: Date,
): boolean {
  if (date.getTime() < employee.startDate.getTime()) {
    return false;
  }
  if (employee.endDate && date.getTime() > employee.endDate.getTime()) {
    return false;
  }
  return true;
}

export function isWithinProjectPeriod(
  project: { startDate: Date; endDate: Date },
  date: Date,
): boolean {
  return dateInRange(date, project.startDate, project.endDate);
}
