import { ModulePlaceholder } from "@/components/navigation/ModulePlaceholder";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  return (
    <ModulePlaceholder
      title="Projects"
      description="Administrators can create and manage projects. Supervisors can view all projects. Employees can view assigned projects."
    />
  );
}
