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

  return (
    <div className="mx-auto w-full">
      <DashboardHeader
        title={isEmployee ? "My Capacity" : "Capacity Dashboard"}
        description={
          isEmployee
            ? `Welcome, ${firstName}. Your capacity for the selected six-week period.`
            : "Management view for the next six weeks"
        }
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
          <div className="space-y-3">
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
          <div className="space-y-3">
            <DashboardKpiGrid kpis={dashboard.kpis} />
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
              <CapacityStackedChart weeks={dashboard.chart} />
              <FreeResourcesList rows={dashboard.freeResources} />
            </div>
            <UtilizationHeatmap
              rows={dashboard.heatmap}
              weekStarts={dashboard.weekStarts}
            />
          </div>
        )
      ) : null}
    </div>
  );
}
