import { EmployeeSelector } from "@/components/planning/EmployeeSelector";
import { ViewSelector } from "@/components/planning/ViewSelector";
import { WeekNavigator } from "@/components/planning/WeekNavigator";
import type { SaveStatus } from "@/hooks/useCapacityPlanning";
import type { PlanningView } from "@/types/capacityPlan.types";
import type { EmployeeResponse } from "@/types/employee.types";

type PlanningFiltersProps = {
  weekStarts: string[];
  weekStart: string;
  weekIndex: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  onWeekChange: (weekStart: string) => void;
  employees: EmployeeResponse[];
  employeeId: string;
  onEmployeeChange: (employeeId: string) => void;
  employeeLocked: boolean;
  view: PlanningView;
  onViewChange: (view: PlanningView) => void;
  canCopyWeek: boolean;
  onCopyWeek: () => void;
  canEdit: boolean;
  saveStatus: SaveStatus;
  saveMessage: string | null;
  onSave: () => void;
  dirty: boolean;
};

export function PlanningFilters({
  weekStarts,
  weekStart,
  weekIndex,
  canGoPrev,
  canGoNext,
  onWeekChange,
  employees,
  employeeId,
  onEmployeeChange,
  employeeLocked,
  view,
  onViewChange,
  canCopyWeek,
  onCopyWeek,
  canEdit,
  saveStatus,
  saveMessage,
  onSave,
  dirty,
}: PlanningFiltersProps) {
  return (
    <section className="mb-3 rounded-md border border-border bg-surface px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <WeekNavigator
          weekStarts={weekStarts}
          weekStart={weekStart}
          weekIndex={weekIndex}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          onChange={onWeekChange}
        />

        <EmployeeSelector
          employees={employees}
          employeeId={employeeId}
          onChange={onEmployeeChange}
          locked={employeeLocked}
        />

        <ViewSelector view={view} onChange={onViewChange} />

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {saveMessage ? (
            <p
              className={[
                "text-xs",
                saveStatus === "error"
                  ? "text-utilization-critical"
                  : saveStatus === "saved"
                    ? "text-utilization-well"
                    : "text-muted",
              ].join(" ")}
              aria-live="polite"
            >
              {saveMessage}
            </p>
          ) : null}
          {canEdit ? (
            <button
              type="button"
              onClick={onSave}
              disabled={saveStatus === "saving" || !dirty}
              className="h-8 rounded border border-border px-3 text-[13px] font-medium text-foreground hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saveStatus === "saving" ? "Saving..." : "Save"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onCopyWeek}
            disabled={!canCopyWeek}
            title={
              canCopyWeek
                ? "Copy planned hours to the next week"
                : "Copy Week is only available within the six-week horizon"
            }
            className="h-8 rounded bg-accent px-3 text-[13px] font-semibold text-accent-foreground hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            Copy Week
          </button>
        </div>
      </div>
    </section>
  );
}
