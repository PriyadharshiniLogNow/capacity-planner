import { ModulePlaceholder } from "@/components/navigation/ModulePlaceholder";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  return (
    <ModulePlaceholder
      title="Projects"
      description="Project master data is available through the API. Management can view projects; only Administrators can change them."
    />
  );
}
