import {
  addDays,
  isoWeekday,
  parseDateOnly,
  weekDates,
} from "@/lib/date/weeks";
import { calcUtilizationPercentage } from "@/lib/utilization";
import type { AbsenceResponse, AbsenceType } from "@/types/absence.types";
import type { EmployeeResponse } from "@/types/employee.types";
import type { ProjectResponse } from "@/types/project.types";

export type DailyHours = Record<number, number>;

export type PlanningDay = {
  date: string;
  weekday: number;
  label: string;
  shortDate: string;
  isWorkingDay: boolean;
  isEmployeeValid: boolean;
  isHoliday: boolean;
  holidayName: string | null;
  isAbsence: boolean;
  absenceName: string | null;
  dailyTarget: number;
  contractHours: number;
  availableHours: number;
  blockedReason: string | null;
};

export type RowStatus =
  | "Planned"
  | "Approved"
  | "Warning"
  | "Overallocated"
  | "Available"
  | "Locked";

export type WeekCapacityTotals = {
  weeklyTarget: number;
  weeklyCapacity: number;
  absenceHours: number;
  holidayHours: number;
  availableCapacity: number;
  plannedHours: number;
  freeCapacity: number;
  utilization: number;
  overallocationHours: number;
};

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function roundHours(value: number): number {
  return Math.round(value * 10) / 10;
}

export function formatPlanningHours(value: number): string {
  return `${roundHours(value).toFixed(1)} h`;
}

export function toDateOnly(value: string): string {
  return value.slice(0, 10);
}

export function dailyTargetHours(
  weeklyHours: number,
  workingDays: number[],
): number {
  if (workingDays.length === 0 || weeklyHours <= 0) {
    return 0;
  }
  return weeklyHours / workingDays.length;
}

export function emptyDailyHours(): DailyHours {
  return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
}

export function sumDailyHours(
  dailyHours: DailyHours,
  weekdays?: number[],
): number {
  const keys = weekdays ?? Object.keys(dailyHours).map(Number);
  return roundHours(keys.reduce((sum, day) => sum + (dailyHours[day] ?? 0), 0));
}

export function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return toDateOnly(aStart) <= toDateOnly(bEnd) && toDateOnly(bStart) <= toDateOnly(aEnd);
}

export function isDateInRange(date: string, start: string, end: string): boolean {
  const value = toDateOnly(date);
  return value >= toDateOnly(start) && value <= toDateOnly(end);
}

export function isEmployeeActiveOnDate(
  employee: EmployeeResponse,
  date: string,
): boolean {
  if (employee.status !== "ACTIVE") {
    return false;
  }
  const value = toDateOnly(date);
  if (value < toDateOnly(employee.startDate)) {
    return false;
  }
  if (employee.endDate && value > toDateOnly(employee.endDate)) {
    return false;
  }
  return true;
}

export function isEmployeeValidForWeek(
  employee: EmployeeResponse,
  weekStart: string,
): boolean {
  if (employee.status !== "ACTIVE") {
    return false;
  }
  const weekEnd = addDays(weekStart, 6);
  return rangesOverlap(
    weekStart,
    weekEnd,
    employee.startDate,
    employee.endDate ?? weekEnd,
  );
}

export function isProjectOpen(project: Pick<ProjectResponse, "status">): boolean {
  return project.status === "OPEN";
}

export function isProjectValidForDate(
  project: Pick<ProjectResponse, "status" | "startDate" | "endDate">,
  date: string,
): boolean {
  if (!isProjectOpen(project)) {
    return false;
  }
  return isDateInRange(date, project.startDate, project.endDate);
}

export function isProjectValidForWeek(
  project: Pick<ProjectResponse, "status" | "startDate" | "endDate">,
  weekStart: string,
): boolean {
  if (!isProjectOpen(project)) {
    return false;
  }
  return rangesOverlap(
    weekStart,
    addDays(weekStart, 6),
    project.startDate,
    project.endDate,
  );
}

export function absenceDisplayName(
  type: AbsenceType,
  note: string | null,
): string {
  switch (type) {
    case "VACATION":
      return "Vacation";
    case "SICKNESS":
      return "Sickness";
    case "PUBLIC_HOLIDAY":
      return note?.trim() || "Public Holiday";
    default:
      return note?.trim() || "Absence";
  }
}

export function buildPlanningDays(
  weekStart: string,
  employee: EmployeeResponse,
  absences: AbsenceResponse[],
): PlanningDay[] {
  const daily = dailyTargetHours(employee.weeklyHours, employee.workingDays);
  const working = new Set(employee.workingDays);

  return weekDates(weekStart).map((date) => {
    const weekday = isoWeekday(date);
    const isWorkingDay = working.has(weekday);
    const isEmployeeValid = isEmployeeActiveOnDate(employee, date);
    const covering = absences.filter((absence) =>
      isDateInRange(date, absence.startDate, absence.endDate),
    );
    const holiday = covering.find(
      (absence) => absence.absenceType === "PUBLIC_HOLIDAY",
    );
    const absence = covering.find(
      (item) => item.absenceType !== "PUBLIC_HOLIDAY",
    );
    const isHoliday = Boolean(holiday);
    const isAbsence = Boolean(absence);
    const contractHours = isWorkingDay && isEmployeeValid ? daily : 0;
    const availableHours =
      contractHours > 0 && !isHoliday && !isAbsence ? daily : 0;

    let blockedReason: string | null = null;
    if (employee.status !== "ACTIVE") {
      blockedReason = "This employee is inactive and cannot be planned.";
    } else if (!isEmployeeValid) {
      blockedReason =
        "Planning is not allowed because the employee is outside their validity period.";
    } else if (!isWorkingDay) {
      blockedReason = "Non-working day for this employee.";
    } else if (isHoliday) {
      blockedReason = `${absenceDisplayName("PUBLIC_HOLIDAY", holiday?.note ?? null)} — project planning is not available.`;
    } else if (isAbsence) {
      blockedReason = `Approved absence (${absenceDisplayName(absence!.absenceType, absence!.note)}) — project planning is not available.`;
    }

    const parsed = parseDateOnly(date);

    return {
      date,
      weekday,
      label: WEEKDAY_LABELS[weekday - 1],
      shortDate: String(parsed.getUTCDate()).padStart(2, "0"),
      isWorkingDay,
      isEmployeeValid,
      isHoliday,
      holidayName: holiday
        ? absenceDisplayName("PUBLIC_HOLIDAY", holiday.note)
        : null,
      isAbsence,
      absenceName: absence
        ? absenceDisplayName(absence.absenceType, absence.note)
        : null,
      dailyTarget: daily,
      contractHours,
      availableHours,
      blockedReason,
    };
  });
}

export function visibleWeekdays(workingDays: number[]): number[] {
  const days = workingDays
    .filter((day) => day >= 1 && day <= 7)
    .sort((a, b) => a - b);
  return days.length > 0 ? days : [1, 2, 3, 4, 5];
}

export function computeWeeklyCapacity(days: PlanningDay[]): number {
  return roundHours(days.reduce((sum, day) => sum + day.contractHours, 0));
}

export function computeAvailableCapacity(days: PlanningDay[]): number {
  return roundHours(days.reduce((sum, day) => sum + day.availableHours, 0));
}

export function computeAbsenceHours(days: PlanningDay[]): number {
  return roundHours(
    days.reduce((sum, day) => {
      if (day.contractHours > 0 && day.isAbsence) {
        return sum + day.contractHours;
      }
      return sum;
    }, 0),
  );
}

export function computeHolidayHours(days: PlanningDay[]): number {
  return roundHours(
    days.reduce((sum, day) => {
      if (day.contractHours > 0 && day.isHoliday) {
        return sum + day.contractHours;
      }
      return sum;
    }, 0),
  );
}

export function plannedByDay(rows: { dailyHours: DailyHours }[]): DailyHours {
  const totals = emptyDailyHours();
  for (const row of rows) {
    for (const [day, hours] of Object.entries(row.dailyHours)) {
      const weekday = Number(day);
      totals[weekday] = (totals[weekday] ?? 0) + hours;
    }
  }
  for (const day of Object.keys(totals)) {
    totals[Number(day)] = roundHours(totals[Number(day)]);
  }
  return totals;
}

export function computePlannedHours(rows: { dailyHours: DailyHours }[]): number {
  return sumDailyHours(plannedByDay(rows));
}

export function computeFreeCapacity(
  availableCapacity: number,
  plannedHours: number,
): number {
  return roundHours(availableCapacity - plannedHours);
}

export function computeOverallocationHours(
  plannedHours: number,
  availableCapacity: number,
): number {
  return roundHours(Math.max(0, plannedHours - availableCapacity));
}

export function computeUtilization(
  plannedHours: number,
  availableCapacity: number,
): number {
  return calcUtilizationPercentage(plannedHours, availableCapacity);
}

export function computeWeekTotals(
  employee: EmployeeResponse,
  days: PlanningDay[],
  projectRows: { dailyHours: DailyHours }[],
): WeekCapacityTotals {
  const weeklyCapacity = computeWeeklyCapacity(days);
  const absenceHours = computeAbsenceHours(days);
  const holidayHours = computeHolidayHours(days);
  const availableCapacity = computeAvailableCapacity(days);
  const plannedHours = computePlannedHours(projectRows);
  const freeCapacity = computeFreeCapacity(availableCapacity, plannedHours);
  const overallocationHours = computeOverallocationHours(
    plannedHours,
    availableCapacity,
  );

  return {
    weeklyTarget: employee.weeklyHours,
    weeklyCapacity,
    absenceHours,
    holidayHours,
    availableCapacity,
    plannedHours,
    freeCapacity,
    utilization: computeUtilization(plannedHours, availableCapacity),
    overallocationHours,
  };
}

export function dailyFreeCapacity(
  days: PlanningDay[],
  planned: DailyHours,
): DailyHours {
  const result = emptyDailyHours();
  for (const day of days) {
    result[day.weekday] = roundHours(
      day.availableHours - (planned[day.weekday] ?? 0),
    );
  }
  return result;
}

export function parseHoursInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return 0;
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) {
    return null;
  }
  return roundHours(value);
}

export function dailyHoursFromApi(
  dailyHours: Partial<Record<string, number>> | null | undefined,
): DailyHours {
  const result = emptyDailyHours();
  if (!dailyHours) {
    return result;
  }
  for (const [day, hours] of Object.entries(dailyHours)) {
    const weekday = Number(day);
    if (weekday >= 1 && weekday <= 7 && typeof hours === "number") {
      result[weekday] = roundHours(Math.max(0, hours));
    }
  }
  return result;
}

export function dailyHoursForApi(dailyHours: DailyHours): Record<string, number> {
  return {
    "1": dailyHours[1] ?? 0,
    "2": dailyHours[2] ?? 0,
    "3": dailyHours[3] ?? 0,
    "4": dailyHours[4] ?? 0,
    "5": dailyHours[5] ?? 0,
    "6": dailyHours[6] ?? 0,
    "7": dailyHours[7] ?? 0,
  };
}

export function distributeWeeklyHours(
  total: number,
  days: PlanningDay[],
  existing?: DailyHours | null,
): DailyHours {
  const result = emptyDailyHours();
  if (existing) {
    const existingTotal = sumDailyHours(existing);
    if (Math.abs(existingTotal - total) < 0.051) {
      return { ...result, ...existing };
    }
  }

  let remaining = roundHours(total);
  const availableDays = days.filter((day) => day.availableHours > 0);
  const targets =
    availableDays.length > 0
      ? availableDays
      : days.filter((day) => day.isWorkingDay && day.isEmployeeValid);

  for (const day of targets) {
    if (remaining <= 0) {
      break;
    }
    const cap = day.availableHours > 0 ? day.availableHours : day.dailyTarget;
    const hours = Math.min(remaining, cap);
    result[day.weekday] = roundHours(hours);
    remaining = roundHours(remaining - hours);
  }

  if (remaining > 0 && targets.length > 0) {
    const last = targets[targets.length - 1];
    result[last.weekday] = roundHours((result[last.weekday] ?? 0) + remaining);
  }

  return result;
}

export function copyDailyHoursToWeek(
  source: DailyHours,
  targetDays: PlanningDay[],
  project: Pick<ProjectResponse, "status" | "startDate" | "endDate">,
): DailyHours {
  const result = emptyDailyHours();
  for (const day of targetDays) {
    const hours = source[day.weekday] ?? 0;
    if (hours <= 0 || day.availableHours <= 0) {
      continue;
    }
    if (!isProjectValidForDate(project, day.date)) {
      continue;
    }
    result[day.weekday] = hours;
  }
  return result;
}

export function projectDayBlockedReason(
  project: Pick<ProjectResponse, "status" | "startDate" | "endDate">,
  day: PlanningDay,
): string | null {
  if (day.blockedReason) {
    return day.blockedReason;
  }
  if (project.status !== "OPEN") {
    return "Planning is not allowed because the project is closed.";
  }
  if (!isDateInRange(day.date, project.startDate, project.endDate)) {
    return "Planning is not allowed because the project is outside its validity period.";
  }
  return null;
}

export function projectRowStatus(params: {
  weeklyTotal: number;
  projectStatus: ProjectResponse["status"];
  validForWeek: boolean;
  overallocated: boolean;
  locked: boolean;
}): RowStatus {
  if (params.locked || params.projectStatus !== "OPEN") {
    return "Locked";
  }
  if (!params.validForWeek) {
    return "Warning";
  }
  if (params.overallocated && params.weeklyTotal > 0) {
    return "Overallocated";
  }
  return "Planned";
}

export function employeePlanningBlockReason(
  employee: EmployeeResponse | null,
  weekStart: string,
): string | null {
  if (!employee) {
    return "Select an employee to start planning.";
  }
  if (employee.status !== "ACTIVE") {
    return "This employee is inactive and cannot be planned.";
  }
  if (!isEmployeeValidForWeek(employee, weekStart)) {
    return "Planning is not allowed because the employee is outside their validity period.";
  }
  if (employee.workingDays.length === 0 || employee.weeklyHours <= 0) {
    return "This employee has no working capacity configured for the selected week.";
  }
  return null;
}
