import type { AbsenceStatus } from "@/types/absence.types";

const LABELS: Record<AbsenceStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const STYLES: Record<AbsenceStatus, string> = {
  PENDING: "bg-utilization-warning/15 text-utilization-warning",
  APPROVED: "bg-utilization-well/15 text-utilization-well",
  REJECTED: "bg-utilization-critical/15 text-utilization-critical",
};

type AbsenceStatusBadgeProps = {
  status: AbsenceStatus;
};

export function absenceStatusLabel(status: AbsenceStatus): string {
  return LABELS[status];
}

export function AbsenceStatusBadge({ status }: AbsenceStatusBadgeProps) {
  return (
    <span
      className={[
        "inline-flex rounded-md px-2 py-0.5 text-xs font-semibold",
        STYLES[status],
      ].join(" ")}
    >
      {LABELS[status]}
    </span>
  );
}
