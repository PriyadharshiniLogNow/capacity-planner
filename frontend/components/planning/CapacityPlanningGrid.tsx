import type { AbsencePlanRow, ProjectPlanRow } from "@/hooks/useCapacityPlanning";
import {
  formatPlanningHours,
  isProjectValidForWeek,
  projectDayBlockedReason,
  projectRowStatus,
  roundHours,
  sumDailyHours,
  type DailyHours,
  type PlanningDay,
  type RowStatus,
} from "@/lib/planning/calculations";
import { formatPercent } from "@/lib/utilization";
import type { PlanningView } from "@/types/capacityPlan.types";
import { useState } from "react";

type CapacityPlanningGridProps = {
  weekStart: string;
  days: PlanningDay[];
  rows: ProjectPlanRow[];
  absenceRows: AbsencePlanRow[];
  plannedDaily: DailyHours;
  freeDaily: DailyHours;
  view: PlanningView;
  readOnly: boolean;
  overallocated: boolean;
  onHoursChange: (rowKey: string, weekday: number, raw: string) => string | null;
  onAddProject: () => void;
  onRemoveProject: (rowKey: string) => void;
  canEdit: boolean;
};

type BadgeTone = "customer" | "internal" | "absence" | "calculated" | "planned" | "approved" | "available" | "warning" | "overallocated" | "locked";

const badgeClass: Record<BadgeTone, string> = {
  customer: "border-[#86efac] bg-[#f0fdf4] text-[#15803d]",
  internal: "border-[#93c5fd] bg-[#eff6ff] text-[#1d4ed8]",
  absence: "border-[#fdba74] bg-[#fff7ed] text-[#c2410c]",
  calculated: "border-[#d1d5db] bg-[#f3f4f6] text-[#4b5563]",
  planned: "border-[#86efac] bg-[#f0fdf4] text-[#15803d]",
  approved: "border-[#86efac] bg-[#f0fdf4] text-[#15803d]",
  available: "border-[#fdba74] bg-[#fff7ed] text-[#c2410c]",
  warning: "border-[#fcd34d] bg-[#fffbeb] text-[#b45309]",
  overallocated: "border-[#fca5a5] bg-[#fef2f2] text-[#b91c1c]",
  locked: "border-[#d1d5db] bg-[#f3f4f6] text-[#4b5563]",
};

function Badge({ label, tone }: { label: string; tone: BadgeTone }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${badgeClass[tone]}`}
    >
      {label}
    </span>
  );
}

function statusTone(status: RowStatus): BadgeTone {
  switch (status) {
    case "Planned":
      return "planned";
    case "Approved":
      return "approved";
    case "Available":
      return "available";
    case "Warning":
      return "warning";
    case "Overallocated":
      return "overallocated";
    case "Locked":
      return "locked";
  }
}

function displayCell(view: PlanningView, hours: number, available: number): string {
  if (view === "utilization") {
    if (available <= 0) {
      return "—";
    }
    return formatPercent(roundHours((hours / available) * 100));
  }
  if (view === "capacity") {
    return formatPlanningHours(available - hours);
  }
  return hours.toFixed(1);
}

const hourBoxClass =
  "h-8 w-full min-w-[3.25rem] rounded border border-border bg-surface px-1 text-center text-[13px] tabular-nums";

function HourInput({
  value,
  label,
  warning,
  onChange,
}: {
  value: number;
  label: string;
  warning: boolean;
  onChange: (raw: string) => void;
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      min={0}
      step={0.5}
      value={value}
      aria-label={label}
      onChange={(event) => onChange(event.target.value)}
      className={[
        hourBoxClass,
        "focus-visible:border-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent",
        warning ? "border-utilization-warning" : "",
      ].join(" ")}
    />
  );
}

function HourReadout({
  value,
  title,
  warning,
}: {
  value: string;
  title?: string;
  warning?: boolean;
}) {
  return (
    <span
      className={[
        hourBoxClass,
        "inline-flex items-center justify-center text-muted",
        warning ? "border-utilization-critical text-utilization-critical" : "",
      ].join(" ")}
      title={title}
    >
      {value}
    </span>
  );
}

function ProjectRow({
  row,
  weekStart,
  days,
  view,
  editable,
  overallocated,
  readOnly,
  canEdit,
  onHoursChange,
  onRemoveProject,
}: {
  row: ProjectPlanRow;
  weekStart: string;
  days: PlanningDay[];
  view: PlanningView;
  editable: boolean;
  overallocated: boolean;
  readOnly: boolean;
  canEdit: boolean;
  onHoursChange: (rowKey: string, weekday: number, raw: string) => string | null;
  onRemoveProject: (rowKey: string) => void;
}) {
  const weekTotal = sumDailyHours(
    row.dailyHours,
    days.map((day) => day.weekday),
  );
  const status = projectRowStatus({
    weeklyTotal: weekTotal,
    projectStatus: row.status,
    validForWeek: isProjectValidForWeek(row, weekStart),
    overallocated,
    locked: readOnly || row.status !== "OPEN",
  });

  return (
    <tr className="border-t border-border">
      <td className="sticky left-0 z-10 bg-surface px-3 py-2">
        <p className="font-semibold text-foreground">{row.projectName}</p>
        <p className="text-[11px] text-muted">{row.projectCode}</p>
      </td>
      <td className="px-2 py-2">
        <Badge
          label={row.type === "CUSTOMER" ? "Customer" : "Internal"}
          tone={row.type === "CUSTOMER" ? "customer" : "internal"}
        />
      </td>
      {days.map((day) => {
        const hours = row.dailyHours[day.weekday] ?? 0;
        const blocked = projectDayBlockedReason(row, day);
        const canType = editable && !blocked;
        return (
          <td key={`${row.key}-${day.date}`} className="px-1.5 py-1.5 text-center">
            {canType ? (
              <HourInput
                value={hours}
                label={`${row.projectName} hours for ${day.label}`}
                warning={hours > day.availableHours && day.availableHours >= 0}
                onChange={(raw) => onHoursChange(row.key, day.weekday, raw)}
              />
            ) : (
              <HourReadout
                value={displayCell(view, hours, day.availableHours)}
                title={blocked ?? undefined}
              />
            )}
          </td>
        );
      })}
      <td className="px-2 py-2 text-right text-[13px] font-semibold tabular-nums">
        {weekTotal.toFixed(1)}
      </td>
      <td className="px-2 py-2">
        <Badge label={status} tone={statusTone(status)} />
      </td>
      {canEdit ? (
        <td className="px-2 py-2 text-right">
          <button
            type="button"
            onClick={() => onRemoveProject(row.key)}
            disabled={readOnly}
            aria-label={`Remove ${row.projectName}`}
            className="text-[11px] font-medium text-muted hover:text-utilization-critical disabled:opacity-40"
          >
            Remove
          </button>
        </td>
      ) : null}
    </tr>
  );
}

function AbsenceRow({
  row,
  days,
  canEdit,
}: {
  row: AbsencePlanRow;
  days: PlanningDay[];
  canEdit: boolean;
}) {
  const weekTotal = sumDailyHours(
    row.dailyHours,
    days.map((day) => day.weekday),
  );
  const isHoliday = row.absenceType === "PUBLIC_HOLIDAY";

  return (
    <tr className="border-t border-border bg-[#fffaf5]">
      <td className="sticky left-0 z-10 bg-[#fffaf5] px-3 py-2">
        <p className="font-semibold text-foreground">{row.name}</p>
        <p className="text-[11px] text-muted">Approved · read-only</p>
      </td>
      <td className="px-2 py-2">
        <Badge label="Absence" tone="absence" />
      </td>
      {days.map((day) => {
        const hours = row.dailyHours[day.weekday] ?? 0;
        return (
          <td key={`${row.key}-${day.date}`} className="px-1.5 py-1.5 text-center">
            <HourReadout
              value={hours.toFixed(1)}
              title={
                hours > 0
                  ? isHoliday
                    ? `${day.holidayName ?? "Public Holiday"} reduces available capacity.`
                    : "Approved absence hours reduce available capacity."
                  : undefined
              }
            />
          </td>
        );
      })}
      <td className="px-2 py-2 text-right text-[13px] font-semibold tabular-nums">
        {weekTotal.toFixed(1)}
      </td>
      <td className="px-2 py-2">
        <Badge label="Approved" tone="approved" />
      </td>
      {canEdit ? <td /> : null}
    </tr>
  );
}

function FreeCapacityRow({
  days,
  plannedDaily,
  freeDaily,
  overallocated,
  canEdit,
}: {
  days: PlanningDay[];
  plannedDaily: DailyHours;
  freeDaily: DailyHours;
  overallocated: boolean;
  canEdit: boolean;
}) {
  const weekTotal = sumDailyHours(
    freeDaily,
    days.map((day) => day.weekday),
  );

  return (
    <tr className="border-t border-border bg-[#f7f9fc]">
      <td className="sticky left-0 z-10 bg-[#f7f9fc] px-3 py-2 font-semibold text-foreground">
        Free Capacity
      </td>
      <td className="px-2 py-2">
        <Badge label="Calculated" tone="calculated" />
      </td>
      {days.map((day) => {
        const free = freeDaily[day.weekday] ?? 0;
        return (
          <td key={`free-${day.date}`} className="px-1.5 py-1.5 text-center">
            <HourReadout
              value={free.toFixed(1)}
              warning={free < 0}
              title={`Available ${day.availableHours.toFixed(1)}h − planned ${(plannedDaily[day.weekday] ?? 0).toFixed(1)}h`}
            />
          </td>
        );
      })}
      <td className="px-2 py-2 text-right text-[13px] font-semibold tabular-nums">
        {weekTotal.toFixed(1)}
      </td>
      <td className="px-2 py-2">
        <Badge
          label={overallocated ? "Overallocated" : "Available"}
          tone={overallocated ? "overallocated" : "available"}
        />
      </td>
      {canEdit ? <td /> : null}
    </tr>
  );
}

export function CapacityPlanningGrid({
  weekStart,
  days,
  rows,
  absenceRows,
  plannedDaily,
  freeDaily,
  view,
  readOnly,
  overallocated,
  onHoursChange,
  onAddProject,
  onRemoveProject,
  canEdit,
}: CapacityPlanningGridProps) {
  const [cellError, setCellError] = useState<string | null>(null);
  const editable = canEdit && !readOnly && view === "hours";
  const colSpan = days.length + (canEdit ? 5 : 4);

  return (
    <section className="rounded-md border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="min-w-[860px] w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-[#e8eef5] text-left text-foreground">
              <th className="sticky left-0 z-10 bg-[#e8eef5] px-3 py-2.5 font-semibold">
                Project / Activity
              </th>
              <th className="px-2 py-2.5 font-semibold">Type</th>
              {days.map((day) => (
                <th key={day.date} className="min-w-[72px] px-1.5 py-2.5 text-center font-semibold">
                  <div>{day.label}</div>
                  {day.isHoliday || day.isAbsence ? (
                    <div className="mt-0.5 text-[10px] font-medium text-utilization-warning">
                      {day.holidayName ?? day.absenceName}
                    </div>
                  ) : null}
                </th>
              ))}
              <th className="px-2 py-2.5 text-right font-semibold">Week</th>
              <th className="px-2 py-2.5 font-semibold">Status</th>
              {canEdit ? (
                <th className="px-2 py-2.5">
                  <span className="sr-only">Actions</span>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && absenceRows.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-3 py-8 text-center text-muted">
                  <p>No projects planned for this week.</p>
                  {canEdit && !readOnly ? (
                    <button
                      type="button"
                      onClick={onAddProject}
                      className="mt-2 text-[13px] font-semibold text-accent hover:underline"
                    >
                      + Add Project / Activity
                    </button>
                  ) : null}
                </td>
              </tr>
            ) : null}

            {rows.map((row) => (
              <ProjectRow
                key={row.key}
                row={row}
                weekStart={weekStart}
                days={days}
                view={view}
                editable={editable}
                overallocated={overallocated}
                readOnly={readOnly}
                canEdit={canEdit}
                onHoursChange={(rowKey, weekday, raw) => {
                  const message = onHoursChange(rowKey, weekday, raw);
                  setCellError(message);
                  return message;
                }}
                onRemoveProject={onRemoveProject}
              />
            ))}

            {absenceRows.map((row) => (
              <AbsenceRow key={row.key} row={row} days={days} canEdit={canEdit} />
            ))}

            <FreeCapacityRow
              days={days}
              plannedDaily={plannedDaily}
              freeDaily={freeDaily}
              overallocated={overallocated}
              canEdit={canEdit}
            />
          </tbody>
        </table>
      </div>

      {cellError ? (
        <p className="border-t border-border px-3 py-2 text-[13px] text-utilization-critical" role="alert">
          {cellError}
        </p>
      ) : null}

      {canEdit && !readOnly && rows.length + absenceRows.length > 0 ? (
        <div className="border-t border-border px-3 py-2">
          <button
            type="button"
            onClick={onAddProject}
            className="text-[13px] font-semibold text-accent hover:underline"
          >
            + Add Project / Activity
          </button>
        </div>
      ) : null}
    </section>
  );
}
