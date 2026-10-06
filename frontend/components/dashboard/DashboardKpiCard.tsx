type KpiTone = "planned" | "actual" | "billable" | "free" | "overallocated";

type DashboardKpiCardProps = {
  title: string;
  value: string;
  hint?: string;
  tone?: KpiTone;
};

const toneClass: Record<KpiTone, string> = {
  planned: "border-t-[#3b82f6] bg-[#eff6ff]",
  actual: "border-t-[#8b5cf6] bg-[#f5f3ff]",
  billable: "border-t-[#22c55e] bg-[#f0fdf4]",
  free: "border-t-[#f59e0b] bg-[#fffbeb]",
  overallocated: "border-t-[#ef4444] bg-[#fef2f2]",
};

export function DashboardKpiCard({
  title,
  value,
  hint,
  tone = "planned",
}: DashboardKpiCardProps) {
  return (
    <article
      className={[
        "rounded-md border border-border border-t-[3px] px-3 py-2.5 shadow-[0_1px_2px_rgba(0,26,51,0.04)]",
        toneClass[tone],
      ].join(" ")}
    >
      <p className="text-[12px] font-medium text-muted">{title}</p>
      <p className="mt-0.5 text-[22px] font-bold leading-tight tabular-nums text-foreground">
        {value}
      </p>
      {hint ? <p className="mt-1 text-[11px] text-muted">{hint}</p> : null}
    </article>
  );
}
