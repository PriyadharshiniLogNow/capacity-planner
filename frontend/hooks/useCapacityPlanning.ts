"use client";

import { listAllAbsences } from "@/lib/api/absences.api";
import {
  createCapacityPlan,
  deleteCapacityPlan,
  listAllCapacityPlans,
  updateCapacityPlan,
} from "@/lib/api/capacityPlan.api";
import { ApiError } from "@/lib/api/client";
import { getEmployeeById, listAllEmployees } from "@/lib/api/employees.api";
import { listAllProjects } from "@/lib/api/projects.api";
import {
  addDays,
  addWeeks,
  getCurrentMonday,
  getPeriodEnd,
  getSixWeekStarts,
} from "@/lib/date/weeks";
import { isPlannerRole } from "@/lib/auth/roles";
import { useAuth } from "@/hooks/useAuth";
import {
  buildPlanningDays,
  computeWeekTotals,
  copyDailyHoursToWeek,
  dailyHoursForApi,
  dailyHoursFromApi,
  distributeWeeklyHours,
  employeePlanningBlockReason,
  emptyDailyHours,
  isDateInRange,
  isProjectValidForWeek,
  parseHoursInput,
  plannedByDay,
  dailyFreeCapacity,
  sumDailyHours,
  visibleWeekdays,
  type DailyHours,
  type PlanningDay,
  type WeekCapacityTotals,
} from "@/lib/planning/calculations";
import type { AbsenceResponse } from "@/types/absence.types";
import type { PlanningView } from "@/types/capacityPlan.types";
import type { EmployeeResponse } from "@/types/employee.types";
import type { ProjectResponse } from "@/types/project.types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type ProjectPlanRow = {
  key: string;
  planId: string | null;
  projectId: string;
  projectCode: string;
  projectName: string;
  type: ProjectResponse["type"];
  status: ProjectResponse["status"];
  startDate: string;
  endDate: string;
  dailyHours: DailyHours;
};

export type AbsencePlanRow = {
  key: string;
  absenceId: string;
  name: string;
  absenceType: AbsenceResponse["absenceType"];
  dailyHours: DailyHours;
};

export type SaveStatus = "idle" | "saving" | "saved" | "error";

function planningErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "EMPLOYEE_OUTSIDE_PLANNING_PERIOD":
        return "Planning is not allowed because the employee is outside their validity period.";
      case "PROJECT_OUTSIDE_PLANNING_PERIOD":
        return "Planning is not allowed because the project is outside its validity period.";
      case "CAPACITY_PLAN_ALREADY_EXISTS":
        return "This project is already planned for the selected week.";
      case "EMPLOYEE_NOT_FOUND":
        return "The selected employee could not be found.";
      case "PROJECT_NOT_FOUND":
        return "The selected project could not be found.";
      case "OVER_CAPACITY":
        return "Employee is overallocated. The plan was saved and flagged for review.";
      default:
        break;
    }
    if (error.status >= 500) {
      return fallback;
    }
    return error.message || fallback;
  }
  return fallback;
}

function snapshotRows(rows: ProjectPlanRow[]): string {
  return JSON.stringify(
    rows.map((row) => ({
      planId: row.planId,
      projectId: row.projectId,
      dailyHours: row.dailyHours,
    })),
  );
}

function toProjectRow(
  plan: {
    id: string;
    projectId: string;
    plannedHours: number;
    dailyHours?: Record<string, number> | null;
    project?: {
      projectCode: string;
      name: string;
      status: string;
    } | null;
  },
  project: ProjectResponse | undefined,
  days: PlanningDay[],
): ProjectPlanRow {
  const stored = dailyHoursFromApi(plan.dailyHours);
  return {
    key: plan.id,
    planId: plan.id,
    projectId: plan.projectId,
    projectCode: project?.projectCode ?? plan.project?.projectCode ?? plan.projectId,
    projectName: project?.name ?? plan.project?.name ?? "Unknown project",
    type: project?.type ?? "INTERNAL",
    status: project?.status ?? (plan.project?.status as ProjectResponse["status"]) ?? "CLOSED",
    startDate: project?.startDate ?? "",
    endDate: project?.endDate ?? "",
    dailyHours: distributeWeeklyHours(plan.plannedHours, days, stored),
  };
}

export function useCapacityPlanning() {
  const { user, token } = useAuth();
  const horizonStart = useMemo(() => getCurrentMonday(), []);
  const weekStarts = useMemo(
    () => getSixWeekStarts(horizonStart),
    [horizonStart],
  );

  const [weekStart, setWeekStart] = useState(horizonStart);
  const [employeeId, setEmployeeId] = useState("");
  const [employees, setEmployees] = useState<EmployeeResponse[]>([]);
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [absences, setAbsences] = useState<AbsenceResponse[]>([]);
  const [rows, setRows] = useState<ProjectPlanRow[]>([]);
  const [view, setView] = useState<PlanningView>("hours");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [savedSnapshot, setSavedSnapshot] = useState("");
  const savedPlanIdsRef = useRef<string[]>([]);
  const saveTimerRef = useRef<number | null>(null);
  const rowsRef = useRef<ProjectPlanRow[]>([]);
  const contextRef = useRef({ employeeId: "", weekStart: horizonStart });

  const canEdit = Boolean(user && isPlannerRole(user.role));
  const isEmployeeUser = user?.role === "EMPLOYEE";

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  useEffect(() => {
    contextRef.current = { employeeId, weekStart };
  }, [employeeId, weekStart]);

  const dirty = snapshotRows(rows) !== savedSnapshot;

  const retry = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!token || !user) {
      return;
    }

    const currentUser = user;
    let cancelled = false;

    async function loadMasters() {
      setLoading(true);
      setError(null);
      try {
        let list: EmployeeResponse[] = [];
        if (isEmployeeUser) {
          if (!currentUser.employeeId) {
            throw new Error("missing-employee");
          }
          const profile = await getEmployeeById(currentUser.employeeId);
          list = [profile];
        } else {
          list = await listAllEmployees();
        }

        let projectList: ProjectResponse[] = [];
        try {
          projectList = await listAllProjects();
        } catch (projectError) {
          console.error(projectError);
        }

        if (cancelled) {
          return;
        }

        setEmployees(list);
        setProjects(projectList);
        setEmployeeId((current) => {
          if (isEmployeeUser) {
            return list[0]?.id ?? "";
          }
          if (current && list.some((item) => item.id === current)) {
            return current;
          }
          return list.find((item) => item.status === "ACTIVE")?.id ?? list[0]?.id ?? "";
        });

        if (list.length === 0) {
          setAbsences([]);
          setRows([]);
          setSavedSnapshot(snapshotRows([]));
          savedPlanIdsRef.current = [];
          setLoading(false);
        }
      } catch (loadError) {
        if (!cancelled) {
          console.error(loadError);
          setEmployees([]);
          setProjects([]);
          setEmployeeId("");
          setAbsences([]);
          setRows([]);
          setSavedSnapshot(snapshotRows([]));
          savedPlanIdsRef.current = [];
          setError(
            currentUser.role === "EMPLOYEE" && !currentUser.employeeId
              ? "Your account is not linked to an employee profile."
              : "Unable to load planning data. Please try again.",
          );
          setLoading(false);
        }
      }
    }

    void loadMasters();
    return () => {
      cancelled = true;
    };
  }, [token, user, isEmployeeUser, reloadKey]);

  useEffect(() => {
    if (!token || !employeeId) {
      return;
    }

    let cancelled = false;

    async function loadWeek() {
      setLoading(true);
      setError(null);
      setSaveStatus("idle");
      setSaveMessage(null);

      try {
        const [absenceList, planList] = await Promise.all([
          listAllAbsences({
            employeeId,
            from: horizonStart,
            to: getPeriodEnd(horizonStart),
          }),
          listAllCapacityPlans({ employeeId, weekStart }),
        ]);

        if (cancelled) {
          return;
        }

        const employee =
          employees.find((item) => item.id === employeeId) ??
          (await getEmployeeById(employeeId));
        const days = employee
          ? buildPlanningDays(weekStart, employee, absenceList)
          : [];
        const nextRows = (planList.data ?? []).map((plan) =>
          toProjectRow(
            plan,
            projects.find((project) => project.id === plan.projectId),
            days,
          ),
        );

        setAbsences(absenceList);
        setRows(nextRows);
        setSavedSnapshot(snapshotRows(nextRows));
        savedPlanIdsRef.current = nextRows
          .map((row) => row.planId)
          .filter((id): id is string => Boolean(id));
      } catch (loadError) {
        if (!cancelled) {
          console.error(loadError);
          setError("Unable to load the capacity plan. Please try again.");
          setRows([]);
          setAbsences([]);
          setSavedSnapshot(snapshotRows([]));
          savedPlanIdsRef.current = [];
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadWeek();
    return () => {
      cancelled = true;
    };
  }, [token, employeeId, weekStart, employees, projects, horizonStart, reloadKey]);

  const employee = useMemo(
    () => employees.find((item) => item.id === employeeId) ?? null,
    [employees, employeeId],
  );

  const weekAbsences = useMemo(() => {
    if (!employee) {
      return [] as AbsenceResponse[];
    }
    const weekEnd = addDays(weekStart, 6);
    return absences.filter(
      (absence) =>
        absence.employeeId === employee.id &&
        absence.startDate <= weekEnd &&
        absence.endDate >= weekStart,
    );
  }, [absences, employee, weekStart]);

  const days = useMemo(() => {
    if (!employee) {
      return [] as PlanningDay[];
    }
    return buildPlanningDays(weekStart, employee, weekAbsences);
  }, [employee, weekAbsences, weekStart]);

  const dayColumns = useMemo(
    () =>
      employee
        ? days.filter((day) =>
            visibleWeekdays(employee.workingDays).includes(day.weekday),
          )
        : days.filter((day) => day.weekday <= 5),
    [days, employee],
  );

  const absenceRows = useMemo<AbsencePlanRow[]>(() => {
    return weekAbsences
      .map((absence) => {
        const dailyHours = emptyDailyHours();
        for (const day of days) {
          if (
            day.contractHours > 0 &&
            isDateInRange(day.date, absence.startDate, absence.endDate)
          ) {
            dailyHours[day.weekday] = day.contractHours;
          }
        }
        return {
          key: absence.id,
          absenceId: absence.id,
          name:
            absence.absenceType === "PUBLIC_HOLIDAY"
              ? absence.note?.trim() || "Public Holiday"
              : absence.absenceType === "VACATION"
                ? "Vacation"
                : absence.absenceType === "SICKNESS"
                  ? "Sickness"
                  : absence.note?.trim() || "Absence",
          absenceType: absence.absenceType,
          dailyHours,
        };
      })
      .filter((row) => days.some((day) => (row.dailyHours[day.weekday] ?? 0) > 0));
  }, [days, weekAbsences]);

  const totals = useMemo<WeekCapacityTotals | null>(() => {
    if (!employee) {
      return null;
    }
    return computeWeekTotals(employee, days, rows);
  }, [days, employee, rows]);

  const plannedDaily = useMemo(() => plannedByDay(rows), [rows]);
  const freeDaily = useMemo(
    () => dailyFreeCapacity(days, plannedDaily),
    [days, plannedDaily],
  );

  const blockReason = employeePlanningBlockReason(employee, weekStart);
  const readOnly = !canEdit || Boolean(blockReason);

  const persistRows = useCallback(
    async (nextRows: ProjectPlanRow[]) => {
      if (!canEdit || !employeeId) {
        return;
      }

      const currentIds = new Set(
        nextRows.map((row) => row.planId).filter((id): id is string => Boolean(id)),
      );
      const toDelete = savedPlanIdsRef.current.filter((id) => !currentIds.has(id));
      const toCreate = nextRows.filter((row) => !row.planId);
      const toUpdate = nextRows.filter((row) => row.planId);

      setSaveStatus("saving");
      setSaveMessage("Saving...");

      try {
        await Promise.all(toDelete.map((id) => deleteCapacityPlan(id)));

        const created = await Promise.all(
          toCreate.map((row) =>
            createCapacityPlan({
              employeeId,
              projectId: row.projectId,
              weekStart,
              plannedHours: sumDailyHours(row.dailyHours),
              dailyHours: dailyHoursForApi(row.dailyHours),
            }).then((plan) => ({ key: row.key, plan })),
          ),
        );

        await Promise.all(
          toUpdate.map((row) =>
            updateCapacityPlan(row.planId as string, {
              plannedHours: sumDailyHours(row.dailyHours),
              dailyHours: dailyHoursForApi(row.dailyHours),
            }),
          ),
        );

        if (
          contextRef.current.employeeId !== employeeId ||
          contextRef.current.weekStart !== weekStart
        ) {
          return;
        }

        const createdByKey = new Map(created.map((item) => [item.key, item.plan.id]));
        const merged = nextRows.map((row) => ({
          ...row,
          planId: row.planId ?? createdByKey.get(row.key) ?? null,
          key: row.planId ?? createdByKey.get(row.key) ?? row.key,
        }));

        setRows(merged);
        setSavedSnapshot(snapshotRows(merged));
        savedPlanIdsRef.current = merged
          .map((row) => row.planId)
          .filter((id): id is string => Boolean(id));
        setSaveStatus("saved");
        setSaveMessage("Saved");
      } catch (persistError) {
        console.error(persistError);
        setSaveStatus("error");
        setSaveMessage(
          planningErrorMessage(
            persistError,
            "Unable to save the capacity plan. Please try again.",
          ),
        );
      }
    },
    [canEdit, employeeId, weekStart],
  );

  const scheduleSave = useCallback(
    (nextRows: ProjectPlanRow[]) => {
      if (!canEdit) {
        return;
      }
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = window.setTimeout(() => {
        void persistRows(nextRows);
      }, 700);
    },
    [canEdit, persistRows],
  );

  const saveNow = useCallback(async () => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    await persistRows(rowsRef.current);
  }, [persistRows]);

  const confirmIfDirty = useCallback(
    (action: () => void) => {
      if (!dirty) {
        action();
        return true;
      }
      const confirmed = window.confirm(
        "You have unsaved planning changes. Are you sure you want to leave?",
      );
      if (!confirmed) {
        return false;
      }
      action();
      return true;
    },
    [dirty],
  );

  const changeWeek = useCallback(
    (nextWeekStart: string, options?: { skipConfirm?: boolean }) => {
      if (!weekStarts.includes(nextWeekStart) || nextWeekStart === weekStart) {
        return;
      }
      if (options?.skipConfirm) {
        setWeekStart(nextWeekStart);
        return;
      }
      confirmIfDirty(() => setWeekStart(nextWeekStart));
    },
    [confirmIfDirty, weekStart, weekStarts],
  );

  const changeEmployee = useCallback(
    (nextEmployeeId: string) => {
      if (!nextEmployeeId || nextEmployeeId === employeeId) {
        return;
      }
      confirmIfDirty(() => setEmployeeId(nextEmployeeId));
    },
    [confirmIfDirty, employeeId],
  );

  const updateHours = useCallback(
    (rowKey: string, weekday: number, raw: string) => {
      if (readOnly) {
        return "Planning is not available for this employee.";
      }
      const parsed = parseHoursInput(raw);
      if (parsed === null) {
        return "Hours cannot be negative.";
      }
      const row = rowsRef.current.find((item) => item.key === rowKey);
      const day = days.find((item) => item.weekday === weekday);
      if (!row || !day) {
        return "Unable to update planned hours.";
      }
      if (row.status !== "OPEN") {
        return "Planning is not allowed because the project is closed.";
      }
      const blocked = day.blockedReason;
      if (blocked) {
        return blocked;
      }
      if (
        row.startDate &&
        row.endDate &&
        !isDateInRange(day.date, row.startDate, row.endDate)
      ) {
        return "Planning is not allowed because the project is outside its validity period.";
      }

      const nextRows = rowsRef.current.map((item) =>
        item.key === rowKey
          ? {
              ...item,
              dailyHours: { ...item.dailyHours, [weekday]: parsed },
            }
          : item,
      );
      rowsRef.current = nextRows;
      setRows(nextRows);
      setSaveStatus("idle");
      scheduleSave(nextRows);
      return null;
    },
    [days, readOnly, scheduleSave],
  );

  const addProject = useCallback(
    (projectId: string, dailyHours: DailyHours) => {
      const project = projects.find((item) => item.id === projectId);
      if (!project) {
        return "The selected project could not be found.";
      }
      if (project.status !== "OPEN") {
        return "Closed projects cannot receive new planning.";
      }
      if (!isProjectValidForWeek(project, weekStart)) {
        return "Planning is not allowed because the project is outside its validity period.";
      }
      if (rowsRef.current.some((row) => row.projectId === projectId)) {
        return "This project is already planned for the selected week.";
      }
      if (blockReason) {
        return blockReason;
      }

      const nextRows = [
        ...rowsRef.current,
        {
          key: `new-${project.id}-${Date.now()}`,
          planId: null,
          projectId: project.id,
          projectCode: project.projectCode,
          projectName: project.name,
          type: project.type,
          status: project.status,
          startDate: project.startDate,
          endDate: project.endDate,
          dailyHours,
        },
      ];
      rowsRef.current = nextRows;
      setRows(nextRows);
      scheduleSave(nextRows);
      return null;
    },
    [blockReason, projects, scheduleSave, weekStart],
  );

  const removeProject = useCallback(
    (rowKey: string) => {
      if (readOnly) {
        return;
      }
      const nextRows = rowsRef.current.filter((row) => row.key !== rowKey);
      rowsRef.current = nextRows;
      setRows(nextRows);
      scheduleSave(nextRows);
    },
    [readOnly, scheduleSave],
  );

  const copyWeek = useCallback(async () => {
    const targetWeekStart = addWeeks(weekStart, 1);
    if (!weekStarts.includes(targetWeekStart)) {
      return "The next week is outside the six-week planning horizon.";
    }
    if (!employee || !canEdit) {
      return "You do not have permission to copy planning.";
    }
    if (blockReason) {
      return blockReason;
    }

    if (dirty) {
      await saveNow();
    }

    try {
      const targetWeekEnd = addDays(targetWeekStart, 6);
      const targetAbsences = absences.filter(
        (absence) =>
          absence.employeeId === employee.id &&
          absence.startDate <= targetWeekEnd &&
          absence.endDate >= targetWeekStart,
      );
      const targetDays = buildPlanningDays(
        targetWeekStart,
        employee,
        targetAbsences,
      );
      const existing = await listAllCapacityPlans({
        employeeId: employee.id,
        weekStart: targetWeekStart,
      });
      const existingProjectIds = new Set(
        existing.data.map((plan) => plan.projectId),
      );

      let copied = 0;
      let skipped = 0;

      for (const row of rowsRef.current) {
        if (existingProjectIds.has(row.projectId)) {
          skipped += 1;
          continue;
        }
        const project = projects.find((item) => item.id === row.projectId);
        if (!project || project.status !== "OPEN") {
          skipped += 1;
          continue;
        }
        const copiedHours = copyDailyHoursToWeek(
          row.dailyHours,
          targetDays,
          project,
        );
        const plannedHours = sumDailyHours(copiedHours);
        if (plannedHours <= 0) {
          skipped += 1;
          continue;
        }

        await createCapacityPlan({
          employeeId: employee.id,
          projectId: row.projectId,
          weekStart: targetWeekStart,
          plannedHours,
          dailyHours: dailyHoursForApi(copiedHours),
        });
        copied += 1;
      }

      return {
        copied,
        skipped,
        targetWeekStart,
      };
    } catch (copyError) {
      console.error(copyError);
      return planningErrorMessage(
        copyError,
        "Unable to copy the capacity plan. Please try again.",
      );
    }
  }, [
    absences,
    blockReason,
    canEdit,
    dirty,
    employee,
    projects,
    saveNow,
    weekStart,
    weekStarts,
  ]);

  const validProjects = useMemo(
    () =>
      projects.filter(
        (project) =>
          project.status === "OPEN" &&
          isProjectValidForWeek(project, weekStart) &&
          !rows.some((row) => row.projectId === project.id),
      ),
    [projects, rows, weekStart],
  );

  const weekIndex = weekStarts.indexOf(weekStart);
  const canGoPrev = weekIndex > 0;
  const canGoNext = weekIndex >= 0 && weekIndex < weekStarts.length - 1;
  const canCopyWeek = canEdit && canGoNext && !blockReason && rows.length > 0;

  useEffect(() => {
    if (!dirty) {
      return;
    }

    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) {
        return;
      }
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http")) {
        return;
      }
      if (href.startsWith("/planning")) {
        return;
      }
      const confirmed = window.confirm(
        "You have unsaved planning changes. Are you sure you want to leave?",
      );
      if (!confirmed) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener("click", onClick, true);

    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  return {
    user,
    canEdit,
    readOnly,
    horizonStart,
    weekStarts,
    weekStart,
    weekIndex,
    canGoPrev,
    canGoNext,
    canCopyWeek,
    changeWeek,
    employeeId,
    changeEmployee,
    employees,
    employee,
    projects,
    validProjects,
    view,
    setView,
    loading,
    error,
    retry,
    rows,
    absenceRows,
    days,
    dayColumns,
    totals,
    plannedDaily,
    freeDaily,
    blockReason,
    dirty,
    saveStatus,
    saveMessage,
    saveNow,
    updateHours,
    addProject,
    removeProject,
    copyWeek,
  };
}
