export function PlanningRuleInfo() {
  return (
    <aside className="rounded-md border border-accent/30 bg-[#f4f8ff] px-3 py-2 text-[13px] text-muted">
      <p>
        <span className="font-semibold text-accent">Rule:</span> Free capacity is
        automatically calculated as available capacity minus planned project hours.
      </p>
    </aside>
  );
}
