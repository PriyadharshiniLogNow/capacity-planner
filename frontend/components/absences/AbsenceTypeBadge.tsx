import type { AbsenceType } from "@/types/absence.types";

const LABELS: Record<AbsenceType, string> = {
  VACATION: "Vacation",
  SICKNESS: "Sickness",
  PUBLIC_HOLIDAY: "Public Holiday",
  OTHER: "Other",
};

const STYLES: Record<AbsenceType, string> = {
  VACATION: "bg-accent-soft text-accent",
  SICKNESS: "bg-utilization-warning/15 text-utilization-warning",
  PUBLIC_HOLIDAY: "bg-background text-muted",
  OTHER: "bg-sidebar/5 text-foreground",
};

type AbsenceTypeBadgeProps = {
  type: AbsenceType;
};

export function absenceTypeLabel(type: AbsenceType): string {
  return LABELS[type];
}

export function AbsenceTypeBadge({ type }: AbsenceTypeBadgeProps) {
  return (
    <span
      className={[
        "inline-flex rounded-md px-2 py-0.5 text-xs font-semibold",
        STYLES[type],
      ].join(" ")}
    >
      {LABELS[type]}
    </span>
  );
}
