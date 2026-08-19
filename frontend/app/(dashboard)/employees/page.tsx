import { ModulePlaceholder } from "@/components/navigation/ModulePlaceholder";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Employees" };

export default function EmployeesPage() {
  return (
    <ModulePlaceholder
      title="Employees"
      description="Administrators can create and manage employees. Supervisors can view their team. Employees can open their own profile from the sidebar."
    />
  );
}
