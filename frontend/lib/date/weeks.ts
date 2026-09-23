const WEEK_COUNT = 6;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function formatDateOnly(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function addDays(value: string, days: number): string {
  const date = parseDateOnly(value);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDateOnly(date);
}

export function addWeeks(value: string, weeks: number): string {
  return addDays(value, weeks * 7);
}

/** Monday of the current Asia/Kolkata calendar week — matches the backend. */
export function getCurrentMonday(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  const today = parseDateOnly(`${year}-${pad(month)}-${pad(day)}`);
  const jsDay = today.getUTCDay();
  const iso = jsDay === 0 ? 7 : jsDay;
  today.setUTCDate(today.getUTCDate() + (1 - iso));
  return formatDateOnly(today);
}

export function getSixWeekStarts(periodStart: string): string[] {
  return Array.from({ length: WEEK_COUNT }, (_, index) =>
    addWeeks(periodStart, index),
  );
}

export function getPeriodEnd(periodStart: string): string {
  return addDays(addWeeks(periodStart, WEEK_COUNT - 1), 6);
}

export function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(parseDateOnly(value));
}

export function formatPeriodRange(periodStart: string): string {
  return `${formatShortDate(periodStart)} – ${formatShortDate(getPeriodEnd(periodStart))}`;
}

export function formatWeekLabel(weekStart: string, index: number): string {
  return `W${index + 1} · ${formatShortDate(weekStart)}`;
}

const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function isoWeekday(value: string): number {
  const jsDay = parseDateOnly(value).getUTCDay();
  return jsDay === 0 ? 7 : jsDay;
}

export function weekDates(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

export function formatWeekRange(weekStart: string): string {
  const start = parseDateOnly(weekStart);
  const end = parseDateOnly(addDays(weekStart, 6));
  const startLabel = `${pad(start.getUTCDate())} ${SHORT_MONTHS[start.getUTCMonth()]}`;
  const endLabel = `${pad(end.getUTCDate())} ${SHORT_MONTHS[end.getUTCMonth()]} ${end.getUTCFullYear()}`;
  return `${startLabel} - ${endLabel}`;
}

export function formatWeekChipRange(weekStart: string): string {
  const start = parseDateOnly(weekStart);
  const end = parseDateOnly(addDays(weekStart, 6));
  return `${pad(start.getUTCDate())} ${SHORT_MONTHS[start.getUTCMonth()]} - ${pad(end.getUTCDate())} ${SHORT_MONTHS[end.getUTCMonth()]}`;
}

export function isCurrentOrPastWeek(weekStart: string): boolean {
  return weekStart <= getCurrentMonday();
}
