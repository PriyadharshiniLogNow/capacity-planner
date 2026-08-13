import { formatHours, formatPercent } from "@/lib/utilization";
import type { DashboardKpis } from "@/hooks/useDashboard";
import { DashboardKpiCard } from "./DashboardKpiCard";

type DashboardKpiGridProps = {
  kpis: DashboardKpis;
};

export function DashboardKpiGrid({ kpis }: DashboardKpiGridProps) {
  return (
    <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <DashboardKpiCard
        title="Planned Utilization"
        value={formatPercent(kpis.plannedUtilization)}
        utilization={kpis.plannedUtilization}
      />
      <DashboardKpiCard
        title="Actual Utilization"
        value={formatPercent(kpis.actualUtilization)}
        utilization={kpis.actualUtilization}
      />
      <DashboardKpiCard
        title="Planned Billable Utilization"
        value={formatPercent(kpis.plannedBillableUtilization)}
        utilization={kpis.plannedBillableUtilization}
      />
      <DashboardKpiCard
        title="Free Capacity"
        value={formatHours(kpis.freeCapacity)}
        hint="Available capacity minus planned hours"
      />
      <DashboardKpiCard
        title="Overallocated Hours"
        value={formatHours(kpis.overallocatedHours)}
        hint={
          kpis.overallocatedHours > 0 ? "Over capacity" : "No overallocation"
        }
      />
    </section>
  );
}
