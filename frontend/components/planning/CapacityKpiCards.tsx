import { formatPlanningHours, type WeekCapacityTotals } from "@/lib/planning/calculations";
import { formatPercent } from "@/lib/utilization";

type CapacityKpiCardsProps = {
  totals: WeekCapacityTotals | null;
};

type KpiTone = "target" | "planned" | "free" | "utilization";

const toneClass: Record<KpiTone, string> = {
  target: "border-t-[#3b82f6] bg-[#eff6ff] text-[#1d4ed8]",
  planned: "border-t-[#22c55e] bg-[#f0fdf4] text-[#15803d]",
  free: "border-t-[#f59e0b] bg-[#fffbeb] text-[#b45309]",
  utilization: "border-t-[#8b5cf6] bg-[#f5f3ff] text-[#6d28d9]",
};

function KpiCard({
  title,
  value,
  tone,
  warning,
}: {
  title: string;
  value: string;
  tone: KpiTone;
  warning?: boolean;
}) {
  return (
    <article
      className={[
        "rounded-md border border-border border-t-[3px] px-3 py-2.5 shadow-[0_1px_2px_rgba(0,26,51,0.04)]",
        warning ? "border-t-utilization-critical bg-red-50 text-utilization-critical" : toneClass[tone],
      ].join(" ")}
    >
      <p className="text-[12px] font-medium text-muted">{title}</p>
      <p
        className={[
          "mt-0.5 text-[22px] font-bold leading-tight tabular-nums",
          warning ? "text-utilization-critical" : "text-foreground",
        ].join(" ")}
      >
        {value}
      </p>
    </article>
  );
}

export function CapacityKpiCards({ totals }: CapacityKpiCardsProps) {
  const planned = totals?.plannedHours ?? 0;
  const free = totals?.freeCapacity ?? 0;
  const overallocated = (totals?.overallocationHours ?? 0) > 0;

  return (
    <section className="mb-3 grid grid-cols-2 gap-2.5 xl:grid-cols-4">
      <KpiCard
        title="Weekly Target"
        value={formatPlanningHours(totals?.weeklyTarget ?? 0)}
        tone="target"
      />
      <KpiCard
        title="Planned"
        value={formatPlanningHours(planned)}
        tone="planned"
        warning={overallocated}
      />
      <KpiCard
        title="Free"
        value={formatPlanningHours(free)}
        tone="free"
        warning={overallocated}
      />
      <KpiCard
        title="Utilization"
        value={formatPercent(totals?.utilization ?? 0)}
        tone="utilization"
        warning={overallocated}
      />
    </section>
  );
}
