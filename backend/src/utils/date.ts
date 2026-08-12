/** Parse YYYY-MM-DD into a UTC Date suitable for Prisma @db.Date. */
export function parseDateOnly(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Format a Date (or date-like) as YYYY-MM-DD. */
export function formatDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}
