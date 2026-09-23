import type { PlanningView } from "@/types/capacityPlan.types";

type ViewSelectorProps = {
  view: PlanningView;
  onChange: (view: PlanningView) => void;
};

export function ViewSelector({ view, onChange }: ViewSelectorProps) {
  return (
    <label className="flex items-center gap-2 text-[13px]">
      <span className="shrink-0 font-medium text-foreground">View:</span>
      <select
        className="h-8 min-w-[7.5rem] rounded border border-border bg-surface px-2 text-[13px] text-foreground focus-visible:border-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
        value={view}
        onChange={(event) => onChange(event.target.value as PlanningView)}
        aria-label="Planning view"
      >
        <option value="hours">Hours</option>
        <option value="utilization">Utilization</option>
        <option value="capacity">Capacity</option>
      </select>
    </label>
  );
}
