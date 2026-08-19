"use client";

import { useAuth } from "@/hooks/useAuth";
import {
  approveAbsence,
  createAbsence,
  deleteAbsence,
  listAllAbsences,
  rejectAbsence,
  updateAbsence,
} from "@/lib/api/absences.api";
import { ApiError } from "@/lib/api/client";
import { listAllEmployees } from "@/lib/api/employees.api";
import {
  isEmployeeRole,
  isManagementRole,
  isPlannerRole,
} from "@/lib/auth/roles";
import type {
  AbsenceFilterState,
  AbsenceResponse,
  CreateAbsenceRequest,
  UpdateAbsenceRequest,
} from "@/types/absence.types";
import type { EmployeeResponse } from "@/types/employee.types";
import { useCallback, useEffect, useMemo, useState } from "react";

function loadErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return "You do not have permission to access these absences.";
    }
    return error.message || "Unable to load absences.";
  }
  return "Unable to load absences.";
}

function mutationErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return "You do not have permission to perform this action.";
    }
    return error.message || fallback;
  }
  return fallback;
}

const EMPTY_FILTERS: AbsenceFilterState = {
  employeeId: "",
  absenceType: "",
  status: "",
  from: "",
  to: "",
};

export function useAbsences() {
  const { user, token } = useAuth();
  const [absences, setAbsences] = useState<AbsenceResponse[]>([]);
  const [employees, setEmployees] = useState<EmployeeResponse[]>([]);
  const [filters, setFilters] = useState<AbsenceFilterState>(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);

  const canManage = Boolean(
    user && (isPlannerRole(user.role) || isEmployeeRole(user.role)),
  );
  const canCreate = Boolean(
    user &&
      (isPlannerRole(user.role) ||
        (isEmployeeRole(user.role) && user.employeeId)),
  );
  const canReview = Boolean(
    user && (isPlannerRole(user.role) || isManagementRole(user.role)),
  );
  const isEmployee = Boolean(user && isEmployeeRole(user.role));
  const isSupervisor = Boolean(user && isManagementRole(user.role));
  const isAdmin = Boolean(user && isPlannerRole(user.role));

  const retry = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  const updateFilters = useCallback((patch: Partial<AbsenceFilterState>) => {
    setFilters((current) => ({ ...current, ...patch }));
    setNotice(null);
  }, []);

  useEffect(() => {
    if (!token || !user) {
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      if (!user) {
        setLoading(false);
        return;
      }

      const currentUser = user;

      try {
        const listQuery: Parameters<typeof listAllAbsences>[0] = {};

        if (isEmployeeRole(currentUser.role)) {
          if (currentUser.employeeId) {
            listQuery.employeeId = currentUser.employeeId;
          }
        } else if (filters.employeeId) {
          listQuery.employeeId = filters.employeeId;
        }

        if (filters.from) {
          listQuery.from = filters.from;
        }
        if (filters.to) {
          listQuery.to = filters.to;
        }
        if (filters.status) {
          listQuery.status = filters.status;
        }

        const [absenceRows, employeeRows] = await Promise.all([
          listAllAbsences(listQuery),
          isEmployeeRole(currentUser.role)
            ? Promise.resolve([] as EmployeeResponse[])
            : listAllEmployees({ status: "ACTIVE" }),
        ]);

        if (cancelled) {
          return;
        }

        setAbsences(absenceRows);
        setEmployees(employeeRows);
      } catch (loadError) {
        if (cancelled) {
          return;
        }
        setAbsences([]);
        setEmployees([]);
        setError(loadErrorMessage(loadError));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [
    token,
    user,
    filters.employeeId,
    filters.from,
    filters.to,
    filters.status,
    reloadKey,
  ]);

  const filteredAbsences = useMemo(() => {
    if (!filters.absenceType) {
      return absences;
    }
    return absences.filter(
      (absence) => absence.absenceType === filters.absenceType,
    );
  }, [absences, filters.absenceType]);

  const create = useCallback(async (body: CreateAbsenceRequest) => {
    setMutating(true);
    setNotice(null);
    try {
      await createAbsence(body);
      setNotice("Absence created successfully.");
      setReloadKey((key) => key + 1);
      return { ok: true as const };
    } catch (mutationError) {
      return {
        ok: false as const,
        message: mutationErrorMessage(
          mutationError,
          "Unable to create absence.",
        ),
      };
    } finally {
      setMutating(false);
    }
  }, []);

  const update = useCallback(async (id: string, body: UpdateAbsenceRequest) => {
    setMutating(true);
    setNotice(null);
    try {
      await updateAbsence(id, body);
      setNotice("Absence updated successfully.");
      setReloadKey((key) => key + 1);
      return { ok: true as const };
    } catch (mutationError) {
      return {
        ok: false as const,
        message: mutationErrorMessage(
          mutationError,
          "Unable to update absence.",
        ),
      };
    } finally {
      setMutating(false);
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    setMutating(true);
    setNotice(null);
    try {
      await deleteAbsence(id);
      setNotice("Absence deleted successfully.");
      setReloadKey((key) => key + 1);
      return { ok: true as const };
    } catch (mutationError) {
      return {
        ok: false as const,
        message: mutationErrorMessage(
          mutationError,
          "Unable to delete absence.",
        ),
      };
    } finally {
      setMutating(false);
    }
  }, []);

  const approve = useCallback(async (id: string) => {
    setMutating(true);
    setNotice(null);
    try {
      await approveAbsence(id);
      setNotice("Leave request approved successfully.");
      setReloadKey((key) => key + 1);
      return { ok: true as const };
    } catch (mutationError) {
      return {
        ok: false as const,
        message: mutationErrorMessage(
          mutationError,
          "Unable to approve leave request.",
        ),
      };
    } finally {
      setMutating(false);
    }
  }, []);

  const reject = useCallback(async (id: string, rejectionReason: string) => {
    setMutating(true);
    setNotice(null);
    try {
      await rejectAbsence(id, { rejectionReason });
      setNotice("Leave request rejected successfully.");
      setReloadKey((key) => key + 1);
      return { ok: true as const };
    } catch (mutationError) {
      return {
        ok: false as const,
        message: mutationErrorMessage(
          mutationError,
          "Unable to reject leave request.",
        ),
      };
    } finally {
      setMutating(false);
    }
  }, []);

  const pageTitle = isEmployee
    ? "My Absences"
    : isSupervisor
      ? "Team Absences"
      : "Absence Management";

  return {
    user,
    absences: filteredAbsences,
    employees,
    filters,
    updateFilters,
    loading,
    error,
    retry,
    notice,
    clearNotice: () => setNotice(null),
    mutating,
    canManage,
    canCreate,
    canEdit: isEmployee,
    canDelete: isEmployee,
    canReview,
    isEmployee,
    isSupervisor,
    isAdmin,
    pageTitle,
    create,
    update,
    remove,
    approve,
    reject,
  };
}
