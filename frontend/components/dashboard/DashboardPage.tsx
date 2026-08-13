"use client";

import { CapacityStackedChart } from "@/components/dashboard/CapacityStackedChart";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { DashboardError } from "@/components/dashboard/DashboardError";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardKpiGrid } from "@/components/dashboard/DashboardKpiGrid";
import { DashboardLoading } from "@/components/dashboard/DashboardLoading";
import { EmployeeWeeklyTables } from "@/components/dashboard/EmployeeWeeklyTables";
import { FreeResourcesList } from "@/components/dashboard/FreeResourcesList";
import { OverallocationCard } from "@/components/dashboard/OverallocationCard";
import { PlanActualVariance } from "@/components/dashboard/PlanActualVariance";
import { UtilizationHeatmap } from "@/components/dashboard/UtilizationHeatmap";
import { useDashboard } from "@/hooks/useDashboard";

export function DashboardPage() {
  const dashboard = useDashboard();
  const role = dashboard.user?.role;

  if (!dashboard.user) {
    return <DashboardLoading />;
  }

  const firstName = dashboard.displayName?.split(" ")[0] ?? "there";
  const isEmployee = role === "EMPLOYEE";
  const isManagement = role === "SUPERVISOR";

  return (
    <div className="mx-auto w-full max-w-7xl">
      <DashboardHeader
        title={
          isEmployee
            ? "My Capacity"
            : isManagement
              ? "Management Dashboard"
              : "Dashboard"
        }
        description={
          isEmployee
            ? `Welcome, ${firstName}. Your capacity for the selected six-week period.`
            : "Capacity overview for the selected period"
        }
        displayName={dashboard.displayName ?? dashboard.user.email}
        role={dashboard.user.role}
      />

      <DashboardFilters
        filters={dashboard.filters}
        onChange={dashboard.updateFilters}
        employees={dashboard.employees}
        projects={dashboard.projects}
        departments={dashboard.departments}
        managers={dashboard.managers}
        compact={isEmployee}
      />

      {dashboard.loading ? <DashboardLoading /> : null}
      {dashboard.error ? (
        <DashboardError message={dashboard.error} onRetry={dashboard.retry} />
      ) : null}
      {dashboard.empty ? <DashboardEmptyState /> : null}

      {!dashboard.loading && !dashboard.error && !dashboard.empty ? (
        isEmployee ? (
          <div className="space-y-6">
            <DashboardKpiGrid kpis={dashboard.kpis} />
            <EmployeeWeeklyTables
              weeks={dashboard.employeeWeeks}
              projects={dashboard.employeeProjects}
            />
            {dashboard.overallocation.length > 0 ? (
              <OverallocationCard rows={dashboard.overallocation} />
            ) : null}
          </div>
        ) : (
          <div className="space-y-6">
            <DashboardKpiGrid kpis={dashboard.kpis} />
            <CapacityStackedChart weeks={dashboard.chart} />
            <UtilizationHeatmap
              rows={dashboard.heatmap}
              weekStarts={dashboard.weekStarts}
            />
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <FreeResourcesList rows={dashboard.freeResources} />
              <PlanActualVariance rows={dashboard.variance} />
            </div>
            <OverallocationCard rows={dashboard.overallocation} />
          </div>
        )
      ) : null}
    </div>
  );
}
