"use client";

import { EmployeeForm } from "@/components/employees/EmployeeForm";
import { Notice, StatusBadge } from "@/components/master-data/Notice";
import { controlClassName } from "@/components/master-data/FormControls";
import { listAllEmployees, listEmployees } from "@/lib/api/employees.api";
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
        const [response, all] = await Promise.all([
          listEmployees({
            page,
            limit: 20,
            search: search.trim() || undefined,
            status: status || undefined,
          }),
          listAllEmployees(),
        ]);
        if (cancelled) {
          return;
        }
        setEmployees(response.data);
        setSupervisors(all);
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
    <div className="mx-auto w-full max-w-7xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-accent">
            LOGNOW CAPACITY PLANNER
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            Employees
          </h1>
          <p className="mt-1 text-sm text-muted">
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
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground shadow-[0_10px_24px_rgba(108,76,232,0.28)] hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            New employee
          </button>
        ) : null}
      </div>

      {notice ? (
        <div className="mb-4">
          <Notice tone="success">{notice}</Notice>
        </div>
      ) : null}
      {error ? (
        <div className="mb-4">
          <Notice tone="error">{error}</Notice>
        </div>
      ) : null}

      <section className="mb-4 rounded-2xl border border-border bg-surface p-4 shadow-[0_8px_30px_rgba(88,70,180,0.06)]">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-foreground">Search</span>
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
              placeholder="ID, first name, or last name"
              className={controlClassName + " border-border"}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-foreground">Status</span>
            <select
              value={status}
              onChange={(event) => {
                setPage(1);
                setStatus(event.target.value as EmployeeStatus | "");
              }}
              className={controlClassName + " border-border"}
            >
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </label>
          <p className="self-end text-sm text-muted">{total} employees</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_8px_30px_rgba(88,70,180,0.06)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-accent-soft/60 text-xs font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Employee ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Hours</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted">
                    Loading employees...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted">
                    No employees found.
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr key={employee.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{employee.employeeCode}</td>
                    <td className="px-4 py-3">
                      {employee.firstName} {employee.lastName}
                    </td>
                    <td className="px-4 py-3">{employee.role}</td>
                    <td className="px-4 py-3">{employee.department}</td>
                    <td className="px-4 py-3" title={formatWorkingDays(employee.workingDays)}>
                      {employee.weeklyHours}h
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={employee.status === "ACTIVE" ? "Active" : "Inactive"}
                        tone={employee.status === "ACTIVE" ? "active" : "inactive"}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          className="font-medium text-accent hover:underline"
                          onClick={() => setPanel({ mode: "view", employee })}
                        >
                          View
                        </button>
                        {canEdit ? (
                          <button
                            type="button"
                            className="font-medium text-accent hover:underline"
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
          <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-muted">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        ) : null}
      </section>

      {panel ? (
        <div
          className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-foreground/25 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="employee-form-title"
        >
          <div className="w-full max-w-3xl rounded-2xl border border-border bg-surface p-6 shadow-[0_16px_50px_rgba(27,23,64,0.18)]">
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
