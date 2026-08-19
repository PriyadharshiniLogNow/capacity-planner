type AbsenceEmptyStateProps = {
  isEmployee: boolean;
  canCreate: boolean;
  onAdd: () => void;
};

export function AbsenceEmptyState({
  isEmployee,
  canCreate,
  onAdd,
}: AbsenceEmptyStateProps) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-8 text-center shadow-[0_8px_30px_rgba(88,70,180,0.06)]">
      <h2 className="text-lg font-semibold text-foreground">
        {isEmployee ? "You have no recorded absences." : "No absences found."}
      </h2>
      <p className="mt-2 text-sm text-muted">
        {isEmployee
          ? "Absences you record will appear here and reduce your available capacity."
          : "Try adjusting filters or add a new absence."}
      </p>
      {canCreate ? (
        <button
          type="button"
          onClick={onAdd}
          className="mt-4 inline-flex rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          + Add Absence
        </button>
      ) : null}
    </section>
  );
}
