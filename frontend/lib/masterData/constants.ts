export const INTERNAL_CUSTOMER_NAME = "Log Now";

export const EMPLOYEE_ROLES = [
  "Consultant",
  "Senior Consultant",
  "Analyst",
  "Project Manager",
  "Manager",
  "Director",
  "Administrator",
] as const;

export const EMPLOYEE_DEPARTMENTS = [
  "Delivery",
  "Consulting",
  "Engineering",
  "Management",
  "Operations",
  "Finance",
] as const;

export const WEEKDAY_LABELS: Record<number, string> = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
  7: "Sunday",
};

export type WorkingDaysPreset = {
  id: string;
  label: string;
  days: number[];
};

export const WORKING_DAYS_PRESETS: WorkingDaysPreset[] = [
  { id: "mon-fri", label: "Monday – Friday", days: [1, 2, 3, 4, 5] },
  { id: "mon-thu", label: "Monday – Thursday", days: [1, 2, 3, 4] },
  { id: "sun-thu", label: "Sunday – Thursday", days: [7, 1, 2, 3, 4] },
  { id: "tue-sat", label: "Tuesday – Saturday", days: [2, 3, 4, 5, 6] },
];

export function workingDaysKey(days: number[]): string {
  return [...days].sort((a, b) => a - b).join(",");
}

export function findWorkingDaysPreset(days: number[]): WorkingDaysPreset | undefined {
  const key = workingDaysKey(days);
  return WORKING_DAYS_PRESETS.find((preset) => workingDaysKey(preset.days) === key);
}

export function formatWorkingDays(days: number[]): string {
  const preset = findWorkingDaysPreset(days);
  if (preset) {
    return preset.label;
  }
  return days
    .slice()
    .sort((a, b) => a - b)
    .map((day) => WEEKDAY_LABELS[day] ?? String(day))
    .join(", ");
}

export function withCurrentOption(options: string[], current: string): string[] {
  if (current && !options.includes(current)) {
    return [current, ...options];
  }
  return [...options];
}
