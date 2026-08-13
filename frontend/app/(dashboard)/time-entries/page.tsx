import { ModulePlaceholder } from "@/components/navigation/ModulePlaceholder";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Time Entries" };

export default function TimeEntriesPage() {
  return (
    <ModulePlaceholder
      title="Time Entries"
      description="Time entry capture will be available in a later module. Actual hours already flow into dashboard KPIs."
    />
  );
}
