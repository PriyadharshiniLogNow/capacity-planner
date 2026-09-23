import { CapacityPlanningPage } from "@/components/planning/CapacityPlanningPage";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "6-Week Resource Planning" };

export default function PlanningPage() {
  return <CapacityPlanningPage />;
}
