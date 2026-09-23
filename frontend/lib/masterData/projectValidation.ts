import type { ProjectStatus, ProjectType } from "@/types/project.types";
import { INTERNAL_CUSTOMER_NAME } from "./constants";

export type ProjectFormValues = {
  projectCode: string;
  name: string;
  type: ProjectType | "";
  customerName: string;
  projectManagerId: string;
  startDate: string;
  endDate: string;
  billable: "" | "true" | "false";
  status: ProjectStatus | "";
};

export type ProjectFieldErrors = Partial<Record<keyof ProjectFormValues, string>>;

export function emptyProjectForm(): ProjectFormValues {
  return {
    projectCode: "",
    name: "",
    type: "INTERNAL",
    customerName: INTERNAL_CUSTOMER_NAME,
    projectManagerId: "",
    startDate: "",
    endDate: "",
    billable: "false",
    status: "OPEN",
  };
}

export function validateProjectForm(values: ProjectFormValues): ProjectFieldErrors {
  const errors: ProjectFieldErrors = {};

  if (!values.projectCode.trim()) {
    errors.projectCode = "Project ID is required.";
  }
  if (!values.name.trim()) {
    errors.name = "Project name is required.";
  }
  if (!values.type) {
    errors.type = "Project type is required.";
  }
  if (!values.customerName.trim()) {
    errors.customerName = "Customer is required.";
  }
  if (!values.projectManagerId) {
    errors.projectManagerId = "Project manager is required.";
  }
  if (!values.startDate) {
    errors.startDate = "Start date is required.";
  }
  if (!values.endDate) {
    errors.endDate = "End date is required.";
  }
  if (values.endDate && values.startDate && values.endDate < values.startDate) {
    errors.endDate = "Project end date cannot be earlier than the start date.";
  }
  if (values.billable !== "true" && values.billable !== "false") {
    errors.billable = "Billable is required.";
  }
  if (!values.status) {
    errors.status = "Status is required.";
  }

  return errors;
}
