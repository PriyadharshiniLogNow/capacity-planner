import { ModulePlaceholder } from "@/components/navigation/ModulePlaceholder";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Planning" };

export default function PlanningPage() {
  return (
    <ModulePlaceholder
      title="Planning"
      description="Capacity planning will be available in a later module. Dashboard reporting is ready now."
    />
  );
}
