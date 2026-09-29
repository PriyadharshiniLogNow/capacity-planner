"use client";

import { EmployeeForm } from "@/components/employees/EmployeeForm";
import { Notice, StatusBadge } from "@/components/master-data/Notice";
import {
  codeChipClassName,
  filterControlClassName,
  pagerButtonClassName,
  primaryButtonClassName,
  rowActionClassName,
} from "@/components/master-data/FormControls";
import { listEmployees } from "@/lib/api/employees.api";
import { listSupervisorUserEmployees } from "@/lib/masterData/supervisorUsers";
import { ApiError } from "@/lib/api/client";
import { canAccessPath, isPlannerRole } from "@/lib/auth/roles";
import { formatWorkingDays } from "@/lib/masterData/constants";
import { useAuth } from "@/hooks/useAuth";
import type { EmployeeResponse, EmployeeStatus } from "@/types/employee.types";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type PanelMode = "create" | "edit" | "view";

export function EmployeesPage() {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const canEdit = Boolean(user && isPlannerRole(user.role));

  const [employees, setEmployees] = useState<EmployeeResponse[]>([]);
  const [supervisors, setSupervisors] = useState<EmployeeResponse[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<EmployeeStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [panel, setPanel] = useState<{ mode: PanelMode; employee?: EmployeeResponse } | null>(
    null,
  );

  const unauthorized = Boolean(user && !canAccessPath(user.role, pathname));

  useEffect(() => {
    if (unauthorized) {
      router.replace("/dashboard");
    }
  }, [unauthorized, router]);

  useEffect(() => {
    if (!user || unauthorized) {
      return;
    }

    let cancelled = false;

    async function loadPage() {
      setLoading(true);
      setError(null);
      try {
        const [response, supervisorUsers] = await Promise.all([
          listEmployees({
            page,
            limit: 20,
            search: search.trim() || undefined,
            status: status || undefined,
          }),
          listSupervisorUserEmployees(),
        ]);
        if (cancelled) {
          return;
        }
        setEmployees(response.data);
        setSupervisors(supervisorUsers);
        setTotalPages(response.pagination.totalPages || 1);
        setTotal(response.pagination.total);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : "Unable to load employees.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPage();
    return () => {
      cancelled = true;
    };
  }, [user, unauthorized, page, search, status, reloadKey]);

  if (!user || unauthorized) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-[1280px]">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-accent">
            LOGNOW CAPACITY PLANNER
          </p>
          <h1 className="mt-0.5 text-[26px] font-bold leading-tight text-foreground">
            Employees
          </h1>
          <p className="mt-0.5 text-[13px] text-muted">
            Master data used for capacity, assignments, time entry, and reporting.
          </p>
        </div>
        {canEdit ? (
          <button
            type="button"
            onClick={() => {
              setNotice(null);
              setPanel({ mode: "create" });
            }}
            className={primaryButtonClassName + " mt-1 shrink-0"}
          >
            New employee
          </button>
        ) : null}
      </div>

      {notice ? (
        <div className="mb-3">
          <Notice tone="success">{notice}</Notice>
        </div>
      ) : null}
      {error ? (
        <div className="mb-3">
          <Notice tone="error">{error}</Notice>
        </div>
      ) : null}

      <section className="mb-3 rounded-md border border-border bg-surface px-3 py-2.5 shadow-[0_1px_2px_rgba(0,26,51,0.04)]">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <label className="flex w-full min-w-0 items-center gap-2 text-[13px] sm:w-auto sm:flex-1 sm:max-w-md">
            <span className="shrink-0 font-medium text-foreground">Search</span>
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
              placeholder="ID, first name, or last name"
              className={filterControlClassName + " min-w-0 flex-1"}
            />
          </label>
          <label className="flex min-w-0 items-center gap-2 text-[13px]">
            <span className="shrink-0 font-medium text-foreground">Status</span>
            <select
              value={status}
              onChange={(event) => {
                setPage(1);
                setStatus(event.target.value as EmployeeStatus | "");
              }}
              className={filterControlClassName + " min-w-[9rem]"}
            >
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </label>
          <p className="ml-auto inline-flex items-center rounded-full border border-[#93c5fd] bg-[#eff6ff] px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-[#1d4ed8]">
            {total} employees
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-border bg-surface shadow-[0_1px_2px_rgba(0,26,51,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-border bg-[#e8eef5] text-foreground">
                <th className="px-3 py-2.5 font-semibold">Employee ID</th>
                <th className="px-3 py-2.5 font-semibold">Name</th>
                <th className="px-3 py-2.5 font-semibold">Role</th>
                <th className="px-3 py-2.5 font-semibold">Department</th>
                <th className="px-3 py-2.5 text-right font-semibold">Hours</th>
                <th className="px-3 py-2.5 font-semibold">Status</th>
                <th className="px-3 py-2.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-muted">
                    <span className="inline-flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="h-2 w-2 animate-pulse rounded-full bg-accent"
                      />
                      Loading employees...
                    </span>
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-muted">
                    No employees found.
                  </td>
                </tr>
              ) : (
                employees.map((employee, index) => (
                  <tr
                    key={employee.id}
                    className={[
                      "transition-colors hover:bg-[#f4f8ff]",
                      index > 0 ? "border-t border-border" : "",
                    ].join(" ")}
                  >
                    <td className="px-3 py-2">
                      <span className={codeChipClassName}>{employee.employeeCode}</span>
                    </td>
                    <td className="px-3 py-2 font-semibold text-foreground">
                      {employee.firstName} {employee.lastName}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge label={employee.role} tone="purple" />
                    </td>
                    <td className="px-3 py-2 text-muted">{employee.department}</td>
                    <td
                      className="px-3 py-2 text-right font-semibold tabular-nums text-foreground"
                      title={formatWorkingDays(employee.workingDays)}
                    >
                      {employee.weeklyHours}h
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge
                        label={employee.status === "ACTIVE" ? "Active" : "Inactive"}
                        tone={employee.status === "ACTIVE" ? "active" : "inactive"}
                        dot
                      />
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <div className="inline-flex gap-1">
                        <button
                          type="button"
                          className={rowActionClassName}
                          onClick={() => setPanel({ mode: "view", employee })}
                        >
                          View
                        </button>
                        {canEdit ? (
                          <button
                            type="button"
                            className={rowActionClassName}
                            onClick={() => setPanel({ mode: "edit", employee })}
                          >
                            Edit
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 ? (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-[#f7f9fc] px-3 py-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className={pagerButtonClassName}
            >
              Previous
            </button>
            <span className="text-[13px] tabular-nums text-muted">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => current + 1)}
              className={pagerButtonClassName}
            >
              Next
            </button>
          </div>
        ) : null}
      </section>

      {panel ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/30 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="employee-form-title"
        >
          <div className="w-full max-w-3xl rounded-md border border-border border-t-[3px] border-t-accent bg-surface p-5 shadow-[0_16px_40px_rgba(0,26,51,0.16)]">
            <EmployeeForm
              mode={panel.mode}
              employee={panel.employee}
              supervisors={supervisors}
              onCancel={() => setPanel(null)}
              onSaved={(_saved, message) => {
                setPanel(null);
                setNotice(message);
                setReloadKey((current) => current + 1);
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
