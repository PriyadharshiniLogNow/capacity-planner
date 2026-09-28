import { EmployeesPage } from "@/components/employees/EmployeesPage";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Employees" };

export default function EmployeesRoutePage() {
  return <EmployeesPage />;
}
