import type { ReactNode } from "react";
import { DashboardShell } from "@/components/navigation/DashboardShell";

export default function DashboardGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
