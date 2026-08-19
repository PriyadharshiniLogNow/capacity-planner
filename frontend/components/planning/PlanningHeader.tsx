type PlanningHeaderProps = {
  title: string;
  subtitle: string;
};

export function PlanningHeader({ title, subtitle }: PlanningHeaderProps) {
  return (
    <div className="mb-3 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-[26px] font-bold leading-tight text-foreground">
          {title}
        </h1>
        <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>
      </div>
      <span className="mt-1 inline-flex shrink-0 items-center rounded border border-border px-2 py-0.5 text-[11px] font-medium text-muted">
        Prototype
      </span>
    </div>
  );
}
