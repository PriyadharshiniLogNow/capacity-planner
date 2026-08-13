import { ModulePlaceholder } from "@/components/navigation/ModulePlaceholder";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Employees" };

export default function EmployeesPage() {
  return (
    <ModulePlaceholder
      title="Employees"
      description="Employee master data is available through the API. This screen is read-only for Management and editable for Administrators in a later module."
    />
  );
}
