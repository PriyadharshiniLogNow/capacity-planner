export type UtilizationLevel =
  | "under"
  | "partial"
  | "well"
  | "warning"
  | "critical";

export type UtilizationStatus = {
  level: UtilizationLevel;
  label: string;
};

/** Same rounding as the backend Dashboard / Capacity Summary APIs. */
export function calcUtilizationPercentage(
  hours: number,
  availableCapacity: number,
): number {
  if (availableCapacity <= 0) {
    return 0;
  }

  return Math.round((hours / availableCapacity) * 1000) / 10;
}

export function getUtilizationStatus(value: number): UtilizationStatus {
  if (value < 60) {
    return { level: "under", label: "Underutilized" };
  }
  if (value < 90) {
    return { level: "partial", label: "Partially utilized" };
  }
  if (value <= 100) {
    return { level: "well", label: "Well utilized" };
  }
  if (value <= 110) {
    return { level: "warning", label: "Overallocated warning" };
  }
  return { level: "critical", label: "Critical overallocation" };
}

export function utilizationToneClass(level: UtilizationLevel): string {
  switch (level) {
    case "under":
      return "bg-utilization-under/15 text-utilization-under";
    case "partial":
      return "bg-utilization-partial/15 text-utilization-partial";
    case "well":
      return "bg-utilization-well/15 text-utilization-well";
    case "warning":
      return "bg-utilization-warning/15 text-utilization-warning";
    case "critical":
      return "bg-utilization-critical/15 text-utilization-critical";
  }
}

export function utilizationHeatmapClass(level: UtilizationLevel): string {
  switch (level) {
    case "under":
      return "bg-utilization-under/20 text-foreground";
    case "partial":
      return "bg-utilization-partial/25 text-foreground";
    case "well":
      return "bg-utilization-well/25 text-foreground";
    case "warning":
      return "bg-utilization-warning/30 text-foreground";
    case "critical":
      return "bg-utilization-critical text-white";
  }
}

export function formatHours(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}h` : `${rounded.toFixed(1)}h`;
}

export function formatPercent(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`;
}

export function employeeDisplayName(employee: {
  firstName: string;
  lastName: string;
}): string {
  return `${employee.firstName} ${employee.lastName}`.trim();
}
