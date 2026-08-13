import { ModulePlaceholder } from "@/components/navigation/ModulePlaceholder";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Absences" };

export default function AbsencesPage() {
  return (
    <ModulePlaceholder
      title="Absences"
      description="Absence management will be available in a later module. Recorded absences already reduce available capacity on the dashboard."
    />
  );
}
