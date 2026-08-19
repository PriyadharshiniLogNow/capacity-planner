type AbsenceHeaderProps = {
  title: string;
  description: string;
  canCreate: boolean;
  onAdd: () => void;
  notice?: string | null;
};

export function AbsenceHeader({
  title,
  description,
  canCreate,
  onAdd,
  notice,
}: AbsenceHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-accent">
          LOGNOW CAPACITY PLANNER
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
          {title}
        </h1>
        <p className="mt-1 text-sm text-muted">{description}</p>
        {notice ? (
          <p className="mt-2 text-sm font-medium text-utilization-well" role="status">
            {notice}
          </p>
        ) : null}
      </div>
      {canCreate ? (
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          + Add Absence
        </button>
      ) : null}
    </div>
  );
}
