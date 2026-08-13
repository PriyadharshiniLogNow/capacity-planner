"use client";

import { getEmployeeById } from "@/lib/api/employees.api";
import { useAuth } from "@/hooks/useAuth";
import { canAccessPath } from "@/lib/auth/roles";
import type { EmployeeResponse } from "@/types/employee.types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [employee, setEmployee] = useState<EmployeeResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const unauthorized = Boolean(user && !canAccessPath(user.role, "/profile"));
  const missingLink = Boolean(user && canAccessPath(user.role, "/profile") && !user.employeeId);

  useEffect(() => {
    if (unauthorized) {
      router.replace("/dashboard");
    }
  }, [unauthorized, router]);

  useEffect(() => {
    const employeeId = user?.employeeId;
    if (!employeeId || unauthorized || missingLink) {
      return;
    }

    let cancelled = false;
    void getEmployeeById(employeeId)
      .then((data) => {
        if (!cancelled) {
          setEmployee(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError("Unable to load your profile.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user?.employeeId, unauthorized, missingLink]);

  if (unauthorized) {
    return null;
  }

  if (missingLink) {
    return (
      <section className="rounded-2xl border border-border bg-surface p-6">
        <p className="text-sm text-muted">
          Your account is not linked to an employee profile.
        </p>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="rounded-2xl border border-border bg-surface p-6">
        <p className="text-sm text-muted">{loadError}</p>
      </section>
    );
  }

  if (!employee) {
    return <p className="text-sm text-muted">Loading profile...</p>;
  }

  return (
    <section className="mx-auto max-w-xl rounded-2xl border border-border bg-surface p-6 shadow-[0_8px_30px_rgba(88,70,180,0.06)]">
      <p className="text-xs font-semibold tracking-[0.16em] text-accent">PROFILE</p>
      <h1 className="mt-2 text-2xl font-semibold text-foreground">
        {employee.firstName} {employee.lastName}
      </h1>
      <dl className="mt-6 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted">Employee code</dt>
          <dd className="font-medium">{employee.employeeCode}</dd>
        </div>
        <div>
          <dt className="text-muted">Department</dt>
          <dd className="font-medium">{employee.department}</dd>
        </div>
        <div>
          <dt className="text-muted">Role</dt>
          <dd className="font-medium">{employee.role}</dd>
        </div>
        <div>
          <dt className="text-muted">Weekly hours</dt>
          <dd className="font-medium">{employee.weeklyHours}h</dd>
        </div>
      </dl>
    </section>
  );
}
