import { formatPlanningHours } from "@/lib/planning/calculations";

type OverallocationWarningProps = {
  plannedHours: number;
  availableCapacity: number;
  overallocationHours: number;
};

export function OverallocationWarning({
  plannedHours,
  availableCapacity,
  overallocationHours,
}: OverallocationWarningProps) {
  if (overallocationHours <= 0) {
    return null;
  }

  return (
    <section
      role="alert"
      className="mb-3 rounded-md border border-utilization-critical/30 bg-red-50 px-3 py-2 text-[13px]"
    >
      <p className="font-semibold text-utilization-critical">
        Overallocated: {formatPlanningHours(overallocationHours)}
      </p>
      <p className="mt-0.5 text-muted">
        Planned {formatPlanningHours(plannedHours)} exceeds available capacity of{" "}
        {formatPlanningHours(availableCapacity)}. The plan can still be saved.
      </p>
    </section>
  );
}
