import {
  emptyDailyHours,
  parseHoursInput,
  type PlanningDay,
} from "@/lib/planning/calculations";
import type { ProjectResponse } from "@/types/project.types";
import { useMemo, useState } from "react";

type AddProjectModalProps = {
  open: boolean;
  projects: ProjectResponse[];
  days: PlanningDay[];
  onClose: () => void;
  onAdd: (
    projectId: string,
    dailyHours: ReturnType<typeof emptyDailyHours>,
  ) => string | null;
};

export function AddProjectModal({
  open,
  projects,
  days,
  onClose,
  onAdd,
}: AddProjectModalProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "CUSTOMER" | "INTERNAL">("ALL");
  const [projectId, setProjectId] = useState("");
  const [hours, setHours] = useState(() => emptyDailyHours());
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return projects.filter((project) => {
      if (typeFilter !== "ALL" && project.type !== typeFilter) {
        return false;
      }
      if (!query) {
        return true;
      }
      return `${project.projectCode} ${project.name} ${project.type}`
        .toLowerCase()
        .includes(query);
    });
  }, [projects, search, typeFilter]);

  const selected = projects.find((project) => project.id === projectId);

  if (!open) {
    return null;
  }

  function resetAndClose() {
    setSearch("");
    setTypeFilter("ALL");
    setProjectId("");
    setHours(emptyDailyHours());
    setError(null);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4"
      role="presentation"
      onClick={resetAndClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-project-title"
        className="w-full max-w-xl rounded-md border border-border bg-surface p-5 shadow-[0_16px_40px_rgba(0,26,51,0.16)]"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="add-project-title" className="text-lg font-semibold text-foreground">
          Add Project / Activity
        </h2>
        <p className="mt-1 text-sm text-muted">
          Only valid open projects for this employee and week are listed.
        </p>

        <label className="mt-4 block text-sm">
          <span className="mb-1.5 block font-medium text-foreground">Search projects</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or code"
            className="w-full rounded-md border border-border px-3 py-2 text-sm focus-visible:border-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          />
        </label>

        <label className="mt-3 block text-sm">
          <span className="mb-1.5 block font-medium text-foreground">Type</span>
          <select
            value={typeFilter}
            onChange={(event) => {
              setTypeFilter(event.target.value as "ALL" | "CUSTOMER" | "INTERNAL");
              setProjectId("");
              setError(null);
            }}
            className="w-full rounded-md border border-border px-3 py-2 text-sm focus-visible:border-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            <option value="ALL">All valid projects</option>
            <option value="CUSTOMER">Customer</option>
            <option value="INTERNAL">Internal</option>
          </select>
        </label>

        <label className="mt-3 block text-sm">
          <span className="mb-1.5 block font-medium text-foreground">Project</span>
          <select
            value={projectId}
            onChange={(event) => {
              setProjectId(event.target.value);
              setError(null);
            }}
            className="w-full rounded-md border border-border px-3 py-2 text-sm focus-visible:border-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            <option value="">Select a project</option>
            {filtered.map((project) => (
              <option key={project.id} value={project.id}>
                {project.projectCode} · {project.name}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-3 rounded-md border border-border bg-background px-3 py-2 text-sm">
          <p className="text-muted">Type</p>
          <p className="font-medium text-foreground">
            {selected
              ? selected.type === "CUSTOMER"
                ? "Customer"
                : "Internal"
              : "Determined from the project master"}
          </p>
        </div>

        <fieldset className="mt-4">
          <legend className="mb-2 text-sm font-medium text-foreground">
            Planned hours
          </legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
            {days.map((day) => {
              const blocked = Boolean(day.blockedReason);
              return (
                <label key={day.date} className="block text-xs">
                  <span className="mb-1 block font-medium text-muted">
                    {day.label} {day.shortDate}
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    disabled={blocked}
                    value={hours[day.weekday] ?? 0}
                    aria-label={`Planned hours for ${day.label}`}
                    title={day.blockedReason ?? undefined}
                    onChange={(event) => {
                      const parsed = parseHoursInput(event.target.value);
                      if (parsed === null) {
                        setError("Hours cannot be negative.");
                        return;
                      }
                      setError(null);
                      setHours((current) => ({ ...current, [day.weekday]: parsed }));
                    }}
                    className="w-full rounded border border-border px-2 py-1.5 text-sm disabled:bg-background disabled:text-muted"
                  />
                </label>
              );
            })}
          </div>
        </fieldset>

        {error ? (
          <p className="mt-3 text-sm text-utilization-critical" role="alert">
            {error}
          </p>
        ) : null}

        {filtered.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            No valid projects are available for this employee and week.
          </p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={resetAndClose}
            className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-background"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (!projectId) {
                setError("Select a project to continue.");
                return;
              }
              const message = onAdd(projectId, hours);
              if (message) {
                setError(message);
                return;
              }
              resetAndClose();
            }}
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
          >
            Add Project
          </button>
        </div>
      </div>
    </div>
  );
}
