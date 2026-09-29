import {
  emptyDailyHours,
  parseHoursInput,
  type PlanningDay,
} from "@/lib/planning/calculations";
import type { ProjectResponse } from "@/types/project.types";
import { useEffect, useMemo, useRef, useState } from "react";

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

function normalizeSearch(value: string): string {
  return value
    .toLowerCase()
    .replace(/[·•\-–—_/.,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function projectSearchText(project: ProjectResponse): string {
  return normalizeSearch(
    [
      project.projectCode,
      project.name,
      project.customerName ?? "",
      project.type,
      project.projectManager
        ? `${project.projectManager.firstName} ${project.projectManager.lastName}`
        : "",
    ].join(" "),
  );
}

function projectLabel(project: ProjectResponse): string {
  return `${project.projectCode} · ${project.name}`;
}

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
  const [listOpen, setListOpen] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(
    () => projects.find((project) => project.id === projectId) ?? null,
    [projects, projectId],
  );

  const filtered = useMemo(() => {
    const query = normalizeSearch(search);
    return projects.filter((project) => {
      if (typeFilter !== "ALL" && project.type !== typeFilter) {
        return false;
      }
      if (!query) {
        return true;
      }
      return projectSearchText(project).includes(query);
    });
  }, [projects, search, typeFilter]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (!searchWrapRef.current?.contains(event.target as Node)) {
        setListOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const canAdd = Boolean(selected);
  const showNoResults = projects.length === 0 || (listOpen && filtered.length === 0);

  if (!open) {
    return null;
  }

  function resetAndClose() {
    setSearch("");
    setTypeFilter("ALL");
    setProjectId("");
    setHours(emptyDailyHours());
    setError(null);
    setListOpen(false);
    onClose();
  }

  function selectProject(project: ProjectResponse) {
    setProjectId(project.id);
    setSearch(projectLabel(project));
    setListOpen(false);
    setError(null);
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
          <span className="mb-1.5 block font-medium text-foreground">Type</span>
          <select
            value={typeFilter}
            onChange={(event) => {
              const next = event.target.value as "ALL" | "CUSTOMER" | "INTERNAL";
              setTypeFilter(next);
              setError(null);
              setListOpen(true);
              if (
                selected &&
                next !== "ALL" &&
                selected.type !== next
              ) {
                setProjectId("");
                setSearch("");
              }
            }}
            className="w-full rounded-md border border-border px-3 py-2 text-sm focus-visible:border-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            <option value="ALL">All valid projects</option>
            <option value="CUSTOMER">Customer</option>
            <option value="INTERNAL">Internal</option>
          </select>
        </label>

        <div ref={searchWrapRef} className="relative mt-3">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-foreground">Search projects</span>
            <input
              type="search"
              value={search}
              autoComplete="off"
              aria-expanded={listOpen}
              aria-controls="project-search-results"
              aria-autocomplete="list"
              placeholder="Search by code, name, or customer"
              onFocus={() => setListOpen(true)}
              onChange={(event) => {
                const next = event.target.value;
                setSearch(next);
                setListOpen(true);
                setError(null);
                if (!selected) {
                  return;
                }
                if (normalizeSearch(next) !== normalizeSearch(projectLabel(selected))) {
                  setProjectId("");
                }
              }}
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus-visible:border-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            />
          </label>

          {listOpen ? (
            <ul
              id="project-search-results"
              role="listbox"
              className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border border-border bg-surface shadow-[0_8px_24px_rgba(0,26,51,0.12)]"
            >
              {filtered.length === 0 ? (
                <li className="px-3 py-2.5 text-sm text-muted">
                  No valid projects are available for this employee and week.
                </li>
              ) : (
                filtered.map((project) => {
                  const active = project.id === projectId;
                  return (
                    <li key={project.id} role="option" aria-selected={active}>
                      <button
                        type="button"
                        onClick={() => selectProject(project)}
                        className={[
                          "flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-accent-soft",
                          active ? "bg-accent-soft" : "",
                        ].join(" ")}
                      >
                        <span className="font-medium text-foreground">
                          {project.projectCode} · {project.name}
                        </span>
                        <span className="text-[11px] text-muted">
                          {project.type === "CUSTOMER" ? "Customer" : "Internal"}
                          {project.customerName ? ` · ${project.customerName}` : ""}
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          ) : null}
        </div>

        <div className="mt-3 rounded-md border border-border bg-background px-3 py-2 text-sm">
          {selected ? (
            <>
              <p className="text-muted">Selected project</p>
              <p className="font-medium text-foreground">{projectLabel(selected)}</p>
              {selected.customerName ? (
                <p className="mt-1 text-[12px] text-muted">{selected.customerName}</p>
              ) : null}
              <p className="mt-2 text-muted">Type</p>
              <p className="font-medium text-foreground">
                {selected.type === "CUSTOMER" ? "Customer" : "Internal"}
              </p>
            </>
          ) : (
            <>
              <p className="text-muted">Type</p>
              <p className="font-medium text-foreground">
                Determined from the project master
              </p>
            </>
          )}
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

        {showNoResults && !selected ? (
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
            disabled={!canAdd}
            onClick={() => {
              if (!selected) {
                setError("Select a project to continue.");
                return;
              }
              const message = onAdd(selected.id, hours);
              if (message) {
                setError(message);
                return;
              }
              resetAndClose();
            }}
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add Project
          </button>
        </div>
      </div>
    </div>
  );
}
