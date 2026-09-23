"use client";

import { AddProjectModal } from "@/components/planning/AddProjectModal";
import { CapacityKpiCards } from "@/components/planning/CapacityKpiCards";
import { CapacityPlanningGrid } from "@/components/planning/CapacityPlanningGrid";
import { CopyWeekDialog } from "@/components/planning/CopyWeekDialog";
import { OverallocationWarning } from "@/components/planning/OverallocationWarning";
import { PlanningFilters } from "@/components/planning/PlanningFilters";
import { PlanningHeader } from "@/components/planning/PlanningHeader";
import { PlanningLoading } from "@/components/planning/PlanningLoading";
import { PlanningRuleInfo } from "@/components/planning/PlanningRuleInfo";
import { DashboardError } from "@/components/dashboard/DashboardError";
import { useCapacityPlanning } from "@/hooks/useCapacityPlanning";
import { canAccessPath } from "@/lib/auth/roles";
import { formatWeekRange } from "@/lib/date/weeks";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function CapacityPlanningPage() {
  const planning = useCapacityPlanning();
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [copyBusy, setCopyBusy] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);

  useEffect(() => {
    if (planning.user && !canAccessPath(planning.user.role, "/planning")) {
      router.replace("/dashboard");
    }
  }, [planning.user, router]);

  if (!planning.user || !canAccessPath(planning.user.role, "/planning")) {
    return null;
  }

  const overallocated = (planning.totals?.overallocationHours ?? 0) > 0;

  return (
    <div className="mx-auto w-full max-w-[1280px]">
      <PlanningHeader
        title="6-Week Resource Planning"
        subtitle="Plan hours by employee, project and day"
      />

      <PlanningFilters
        weekStarts={planning.weekStarts}
        weekStart={planning.weekStart}
        weekIndex={planning.weekIndex}
        canGoPrev={planning.canGoPrev}
        canGoNext={planning.canGoNext}
        onWeekChange={planning.changeWeek}
        employees={planning.employees}
        employeeId={planning.employeeId}
        onEmployeeChange={planning.changeEmployee}
        employeeLocked={planning.user.role === "EMPLOYEE"}
        view={planning.view}
        onViewChange={planning.setView}
        canCopyWeek={planning.canCopyWeek}
        onCopyWeek={() => {
          setCopyError(null);
          setCopyOpen(true);
        }}
        canEdit={planning.canEdit}
        saveStatus={planning.saveStatus}
        saveMessage={planning.saveMessage}
        onSave={() => void planning.saveNow()}
        dirty={planning.dirty}
      />

      {planning.loading ? <PlanningLoading /> : null}

      {planning.error ? (
        <DashboardError
          title="Unable to load the capacity plan."
          message={planning.error}
          onRetry={planning.retry}
        />
      ) : null}

      {!planning.loading && !planning.error ? (
        <>
          {planning.blockReason ? (
            <section
              role="status"
              className="mb-3 rounded-md border border-border bg-surface px-3 py-2 text-[13px] text-muted"
            >
              {planning.blockReason}
            </section>
          ) : null}

          <CapacityKpiCards totals={planning.totals} />

          {planning.totals ? (
            <OverallocationWarning
              plannedHours={planning.totals.plannedHours}
              availableCapacity={planning.totals.availableCapacity}
              overallocationHours={planning.totals.overallocationHours}
            />
          ) : null}

          {copyNotice ? (
            <p className="mb-3 text-[13px] text-utilization-well">{copyNotice}</p>
          ) : null}

          <div className="mb-3">
            <CapacityPlanningGrid
              weekStart={planning.weekStart}
              days={planning.dayColumns}
              rows={planning.rows}
              absenceRows={planning.absenceRows}
              plannedDaily={planning.plannedDaily}
              freeDaily={planning.freeDaily}
              view={planning.view}
              readOnly={planning.readOnly}
              overallocated={overallocated}
              onHoursChange={planning.updateHours}
              onAddProject={() => setAddOpen(true)}
              onRemoveProject={planning.removeProject}
              canEdit={planning.canEdit}
            />
          </div>

          <PlanningRuleInfo />
        </>
      ) : null}

      <AddProjectModal
        open={addOpen}
        projects={planning.validProjects}
        days={planning.dayColumns}
        onClose={() => setAddOpen(false)}
        onAdd={planning.addProject}
      />

      <CopyWeekDialog
        open={copyOpen}
        busy={copyBusy}
        error={copyError}
        onCancel={() => {
          if (!copyBusy) {
            setCopyOpen(false);
          }
        }}
        onConfirm={() => {
          setCopyBusy(true);
          setCopyError(null);
          void planning.copyWeek().then((result) => {
            setCopyBusy(false);
            if (typeof result === "string") {
              setCopyError(result);
              return;
            }
            setCopyOpen(false);
            setCopyNotice(
              `Copied ${result.copied} project${result.copied === 1 ? "" : "s"} to ${formatWeekRange(result.targetWeekStart)}${
                result.skipped ? `. ${result.skipped} skipped.` : "."
              }`,
            );
            if (result.copied > 0) {
              planning.changeWeek(result.targetWeekStart, { skipConfirm: true });
            }
          });
        }}
      />
    </div>
  );
}
