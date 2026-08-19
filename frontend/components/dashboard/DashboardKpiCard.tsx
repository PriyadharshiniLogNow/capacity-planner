type KpiTone = "planned" | "actual" | "billable" | "free" | "over";

type DashboardKpiCardProps = {
  title: string;
  value: string;
  tone: KpiTone;
};

const cardToneClass: Record<KpiTone, string> = {
  planned: "border-blue-200 bg-blue-50",
  actual: "border-violet-200 bg-violet-50",
  billable: "border-emerald-200 bg-emerald-50",
  free: "border-amber-200 bg-amber-50",
  over: "border-rose-200 bg-rose-50",
};

const valueToneClass: Record<KpiTone, string> = {
  planned: "text-blue-600",
  actual: "text-violet-600",
  billable: "text-emerald-600",
  free: "text-amber-600",
  over: "text-rose-600",
};

export function DashboardKpiCard({ title, value, tone }: DashboardKpiCardProps) {
  return (
    <article
      className={`flex min-h-[70px] flex-col justify-center rounded-lg border px-3.5 py-2.5 shadow-[0_1px_2px_rgba(11,49,88,0.04)] ${cardToneClass[tone]}`}
    >
      <p className="text-[11px] font-medium leading-tight text-muted">{title}</p>
      <p
        className={`mt-1 text-[21px] font-bold leading-none tracking-tight tabular-nums ${valueToneClass[tone]}`}
      >
        {value}
      </p>
    </article>
  );
}
