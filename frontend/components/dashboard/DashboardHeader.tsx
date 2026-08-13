import { getRoleLabel } from "@/lib/auth/roles";
import type { Role } from "@/types/auth.types";

type DashboardHeaderProps = {
  title: string;
  description: string;
  displayName: string;
  role: Role;
};

export function DashboardHeader({
  title,
  description,
  displayName,
  role,
}: DashboardHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-accent">
          LOGNOW CAPACITY PLANNER
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
          {title}
        </h1>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      <div className="rounded-2xl border border-border bg-surface px-4 py-3">
        <p className="text-sm font-semibold text-foreground">{displayName}</p>
        <p className="text-xs text-muted">{getRoleLabel(role)}</p>
      </div>
    </div>
  );
}
