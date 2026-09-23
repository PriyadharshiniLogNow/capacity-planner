"use client";

import { SpinnerIcon } from "@/components/auth/icons";
import { FormInput, FormSelect } from "@/components/master-data/FormControls";
import { SearchableSelect } from "@/components/master-data/SearchableSelect";
import { Notice } from "@/components/master-data/Notice";
import { ApiError } from "@/lib/api/client";
import { createProject, updateProject } from "@/lib/api/projects.api";
import { INTERNAL_CUSTOMER_NAME } from "@/lib/masterData/constants";
import {
  emptyProjectForm,
  validateProjectForm,
  type ProjectFieldErrors,
  type ProjectFormValues,
} from "@/lib/masterData/projectValidation";
import type { EmployeeResponse } from "@/types/employee.types";
import type { ProjectResponse } from "@/types/project.types";
import { useId, useMemo, useState, type FormEvent } from "react";

type ProjectFormMode = "create" | "edit" | "view";

type ProjectFormProps = {
  mode: ProjectFormMode;
  project?: ProjectResponse | null;
  employees: EmployeeResponse[];
  onCancel: () => void;
  onSaved: (project: ProjectResponse, message: string) => void;
};

function toDateInput(value: string): string {
  return value.slice(0, 10);
}

function valuesFromProject(project: ProjectResponse): ProjectFormValues {
  return {
    projectCode: project.projectCode,
    name: project.name,
    type: project.type,
    customerName: project.customerName ?? "",
    projectManagerId: project.projectManagerId ?? "",
    startDate: toDateInput(project.startDate),
    endDate: toDateInput(project.endDate),
    billable: project.billable ? "true" : "false",
    status: project.status,
  };
}

function mapApiFieldErrors(
  fieldErrors: Record<string, string[] | undefined> | undefined,
): ProjectFieldErrors {
  if (!fieldErrors) {
    return {};
  }
  const next: ProjectFieldErrors = {};
  const keys: (keyof ProjectFormValues)[] = [
    "projectCode",
    "name",
    "type",
    "customerName",
    "projectManagerId",
    "startDate",
    "endDate",
    "billable",
    "status",
  ];
  for (const key of keys) {
    const message = fieldErrors[key]?.[0];
    if (message) {
      next[key] = message;
    }
  }
  return next;
}

export function ProjectForm({
  mode,
  project,
  employees,
  onCancel,
  onSaved,
}: ProjectFormProps) {
  const id = useId();
  const readOnly = mode === "view";
  const isCreate = mode === "create";
  const [values, setValues] = useState<ProjectFormValues>(
    project ? valuesFromProject(project) : emptyProjectForm(),
  );
  const [fieldErrors, setFieldErrors] = useState<ProjectFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const managerOptions = useMemo(() => {
    const options = employees
      .filter(
        (item) => item.status === "ACTIVE" || item.id === values.projectManagerId,
      )
      .map((item) => ({
        value: item.id,
        label: `${item.firstName} ${item.lastName}`,
        hint: item.employeeCode,
      }));

    if (
      project?.projectManager &&
      !options.some((option) => option.value === project.projectManager?.id)
    ) {
      options.unshift({
        value: project.projectManager.id,
        label: `${project.projectManager.firstName} ${project.projectManager.lastName}`,
        hint: project.projectManager.employeeCode,
      });
    }

    return options;
  }, [employees, project, values.projectManagerId]);

  function patch<K extends keyof ProjectFormValues>(
    key: K,
    value: ProjectFormValues[K],
  ) {
    setValues((current) => {
      const next = { ...current, [key]: value };
      if (key === "type" && value === "INTERNAL" && !current.customerName.trim()) {
        next.customerName = INTERNAL_CUSTOMER_NAME;
      }
      return next;
    });
    if (fieldErrors[key]) {
      setFieldErrors((current) => ({ ...current, [key]: undefined }));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (readOnly || isSubmitting) {
      return;
    }

    const errors = validateProjectForm(values);
    setFieldErrors(errors);
    setFormError(null);
    if (Object.values(errors).some(Boolean)) {
      return;
    }

    const payload = {
      projectCode: values.projectCode.trim(),
      name: values.name.trim(),
      type: values.type === "CUSTOMER" ? "CUSTOMER" : "INTERNAL",
      customerName:
        values.type === "INTERNAL" && !values.customerName.trim()
          ? INTERNAL_CUSTOMER_NAME
          : values.customerName.trim(),
      projectManagerId: values.projectManagerId,
      startDate: values.startDate,
      endDate: values.endDate,
      billable: values.billable === "true",
      status: values.status === "CLOSED" ? "CLOSED" : "OPEN",
    } as const;

    setIsSubmitting(true);
    try {
      if (isCreate) {
        const created = await createProject(payload);
        onSaved(created, "Project saved successfully.");
      } else if (project) {
        const updated = await updateProject(project.id, payload);
        onSaved(updated, "Project saved successfully.");
      }
    } catch (error) {
      if (error instanceof ApiError) {
        const mapped = mapApiFieldErrors(error.fieldErrors);
        if (Object.keys(mapped).length > 0) {
          setFieldErrors(mapped);
        }
        setFormError(error.message);
      } else {
        setFormError("Unable to save project. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const title =
    mode === "create" ? "New project" : mode === "edit" ? "Edit project" : "Project details";

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-accent">MASTER DATA</p>
        <h2 id="project-form-title" className="mt-1 text-xl font-semibold text-foreground">{title}</h2>
      </div>

      {formError ? <Notice tone="error">{formError}</Notice> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormInput
          id={`${id}-code`}
          label="Project ID"
          required
          value={values.projectCode}
          disabled={readOnly || isSubmitting}
          error={fieldErrors.projectCode}
          onChange={(event) => patch("projectCode", event.target.value)}
        />
        <FormInput
          id={`${id}-name`}
          label="Project name"
          required
          value={values.name}
          disabled={readOnly || isSubmitting}
          error={fieldErrors.name}
          onChange={(event) => patch("name", event.target.value)}
        />
        <FormSelect
          id={`${id}-type`}
          label="Project type"
          required
          value={values.type}
          disabled={readOnly || isSubmitting}
          error={fieldErrors.type}
          onChange={(event) =>
            patch("type", event.target.value as ProjectFormValues["type"])
          }
        >
          <option value="INTERNAL">Internal</option>
          <option value="CUSTOMER">External</option>
        </FormSelect>
        <FormInput
          id={`${id}-customer`}
          label="Customer"
          required
          value={values.customerName}
          disabled={readOnly || isSubmitting}
          error={fieldErrors.customerName}
          hint={
            values.type === "INTERNAL"
              ? 'Use a customer name or "Log Now" for internal projects.'
              : undefined
          }
          onChange={(event) => patch("customerName", event.target.value)}
        />
        <SearchableSelect
          id={`${id}-pm`}
          label="Project manager"
          required
          disabled={readOnly || isSubmitting}
          value={values.projectManagerId}
          error={fieldErrors.projectManagerId}
          options={managerOptions}
          placeholder="Search project managers"
          onChange={(value) => patch("projectManagerId", value)}
        />
        <FormSelect
          id={`${id}-billable`}
          label="Billable"
          required
          value={values.billable}
          disabled={readOnly || isSubmitting}
          error={fieldErrors.billable}
          onChange={(event) =>
            patch("billable", event.target.value as ProjectFormValues["billable"])
          }
        >
          <option value="true">Yes</option>
          <option value="false">No</option>
        </FormSelect>
        <FormInput
          id={`${id}-start`}
          label="Start date"
          type="date"
          required
          value={values.startDate}
          disabled={readOnly || isSubmitting}
          error={fieldErrors.startDate}
          onChange={(event) => patch("startDate", event.target.value)}
        />
        <FormInput
          id={`${id}-end`}
          label="End date"
          type="date"
          required
          value={values.endDate}
          disabled={readOnly || isSubmitting}
          error={fieldErrors.endDate}
          onChange={(event) => patch("endDate", event.target.value)}
        />
        <FormSelect
          id={`${id}-status`}
          label="Status"
          required
          value={values.status}
          disabled={readOnly || isSubmitting}
          error={fieldErrors.status}
          onChange={(event) =>
            patch("status", event.target.value as ProjectFormValues["status"])
          }
        >
          <option value="OPEN">Active</option>
          <option value="CLOSED">Closed</option>
        </FormSelect>
      </div>

      <div className="flex flex-wrap justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {readOnly ? "Close" : "Cancel"}
        </button>
        {readOnly ? null : (
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground shadow-[0_10px_24px_rgba(108,76,232,0.28)] transition hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <SpinnerIcon />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </button>
        )}
      </div>
    </form>
  );
}
