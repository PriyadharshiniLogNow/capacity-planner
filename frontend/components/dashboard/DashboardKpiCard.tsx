import {
  getUtilizationStatus,
  utilizationToneClass,
} from "@/lib/utilization";

type DashboardKpiCardProps = {
  title: string;
  value: string;
  hint?: string;
  utilization?: number;
};

export function DashboardKpiCard({
  title,
  value,
  hint,
  utilization,
}: DashboardKpiCardProps) {
  const status =
    utilization === undefined ? null : getUtilizationStatus(utilization);

  return (
    <article className="rounded-2xl border border-border bg-surface p-4 shadow-[0_8px_30px_rgba(88,70,180,0.06)] sm:p-5">
      <p className="text-sm font-medium text-muted">{title}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      {status ? (
        <p
          className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${utilizationToneClass(status.level)}`}
        >
          {status.label}
        </p>
      ) : hint ? (
        <p className="mt-3 text-xs text-muted">{hint}</p>
      ) : null}
    </article>
  );
}
