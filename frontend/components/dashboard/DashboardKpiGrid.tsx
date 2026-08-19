import { formatHours, formatPercent } from "@/lib/utilization";
import type { DashboardKpis } from "@/hooks/useDashboard";
import { DashboardKpiCard } from "./DashboardKpiCard";

type DashboardKpiGridProps = {
  kpis: DashboardKpis;
};

export function DashboardKpiGrid({ kpis }: DashboardKpiGridProps) {
  return (
    <section className="mb-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
      <DashboardKpiCard
        title="Planned Utilization"
        value={formatPercent(kpis.plannedUtilization)}
        tone="planned"
      />
      <DashboardKpiCard
        title="Actual Utilization"
        value={formatPercent(kpis.actualUtilization)}
        tone="actual"
      />
      <DashboardKpiCard
        title="Billable Plan"
        value={formatPercent(kpis.plannedBillableUtilization)}
        tone="billable"
      />
      <DashboardKpiCard
        title="Free Capacity"
        value={formatHours(kpis.freeCapacity).replace(/h$/, " h")}
        tone="free"
      />
      <DashboardKpiCard
        title="Overallocated"
        value={formatHours(kpis.overallocatedHours).replace(/h$/, " h")}
        tone="over"
      />
    </section>
  );
}
