import { ProjectsPage } from "@/components/projects/ProjectsPage";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsRoutePage() {
  return <ProjectsPage />;
}
