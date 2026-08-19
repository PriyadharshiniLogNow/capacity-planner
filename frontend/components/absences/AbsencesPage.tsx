"use client";

import { AbsenceEmptyState } from "@/components/absences/AbsenceEmptyState";
import { AbsenceFilters } from "@/components/absences/AbsenceFilters";
import { AbsenceHeader } from "@/components/absences/AbsenceHeader";
import {
  AbsenceModal,
  ApproveAbsenceDialog,
  DeleteAbsenceDialog,
  RejectAbsenceDialog,
} from "@/components/absences/AbsenceModal";
import type { AbsenceFormValues } from "@/components/absences/AbsenceForm";
import { AbsenceTable } from "@/components/absences/AbsenceTable";
import { DashboardError } from "@/components/dashboard/DashboardError";
import { DashboardLoading } from "@/components/dashboard/DashboardLoading";
import { useAbsences } from "@/hooks/useAbsences";
import { canAccessPath } from "@/lib/auth/roles";
import { employeeDisplayName } from "@/lib/utilization";
import type { AbsenceResponse } from "@/types/absence.types";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function defaultFormValues(employeeId = ""): AbsenceFormValues {
  return {
    employeeId,
    absenceType: "VACATION",
    startDate: "",
    endDate: "",
    note: "",
  };
}

export function AbsencesPage() {
  const absences = useAbsences();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<AbsenceResponse | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AbsenceResponse | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [approveTarget, setApproveTarget] = useState<AbsenceResponse | null>(
    null,
  );
  const [approveError, setApproveError] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AbsenceResponse | null>(null);
  const [rejectError, setRejectError] = useState<string | null>(null);

  useEffect(() => {
    if (absences.user && !canAccessPath(absences.user.role, "/absences")) {
      router.replace("/dashboard");
    }
  }, [absences.user, router]);

  const lockedEmployeeId = absences.isEmployee
    ? absences.user?.employeeId ?? ""
    : "";

  const formInitialValues = useMemo(() => {
    if (modalMode === "edit" && editing) {
      return {
        employeeId: editing.employeeId,
        absenceType: editing.absenceType,
        startDate: editing.startDate,
        endDate: editing.endDate,
        note: editing.note ?? "",
      } satisfies AbsenceFormValues;
    }
    return defaultFormValues(lockedEmployeeId);
  }, [modalMode, editing, lockedEmployeeId]);

  if (!absences.user || !canAccessPath(absences.user.role, "/absences")) {
    return null;
  }

  function openCreate() {
    setModalMode("create");
    setEditing(null);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(absence: AbsenceResponse) {
    setModalMode("edit");
    setEditing(absence);
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    if (absences.mutating) {
      return;
    }
    setModalOpen(false);
    setEditing(null);
    setFormError(null);
  }

  async function handleSubmit(values: AbsenceFormValues) {
    setFormError(null);

    if (modalMode === "create") {
      const employeeId = absences.isEmployee
        ? absences.user?.employeeId ?? ""
        : values.employeeId;

      if (!employeeId) {
        setFormError(
          absences.isEmployee
            ? "Your account is not linked to an employee profile."
            : "Select an employee.",
        );
        return;
      }

      const result = await absences.create({
        employeeId,
        startDate: values.startDate,
        endDate: values.endDate,
        absenceType: values.absenceType,
        note: values.note.trim() ? values.note.trim() : null,
      });

      if (!result.ok) {
        setFormError(result.message);
        return;
      }

      setModalOpen(false);
      setEditing(null);
      return;
    }

    if (!editing) {
      return;
    }

    const result = await absences.update(editing.id, {
      startDate: values.startDate,
      endDate: values.endDate,
      absenceType: values.absenceType,
      note: values.note.trim() ? values.note.trim() : null,
    });

    if (!result.ok) {
      setFormError(result.message);
      return;
    }

    setModalOpen(false);
    setEditing(null);
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }
    setDeleteError(null);
    const result = await absences.remove(deleteTarget.id);
    if (!result.ok) {
      setDeleteError(result.message);
      return;
    }
    setDeleteTarget(null);
  }

  async function handleApprove() {
    if (!approveTarget) {
      return;
    }
    setApproveError(null);
    const result = await absences.approve(approveTarget.id);
    if (!result.ok) {
      setApproveError(result.message);
      return;
    }
    setApproveTarget(null);
  }

  async function handleReject(rejectionReason: string) {
    if (!rejectTarget) {
      return;
    }
    setRejectError(null);
    const result = await absences.reject(rejectTarget.id, rejectionReason);
    if (!result.ok) {
      setRejectError(result.message);
      return;
    }
    setRejectTarget(null);
  }

  const description = absences.isEmployee
    ? "View your leave requests and approval status."
    : absences.isSupervisor
      ? "Review and approve team leave requests."
      : "Manage employee absences and leave approvals.";

  return (
    <div className="mx-auto w-full max-w-7xl">
      <AbsenceHeader
        title={absences.pageTitle}
        description={description}
        canCreate={absences.canCreate}
        onAdd={openCreate}
        notice={absences.notice}
      />

      <AbsenceFilters
        filters={absences.filters}
        onChange={absences.updateFilters}
        employees={absences.employees}
        showEmployeeFilter={!absences.isEmployee}
      />

      {absences.loading ? <DashboardLoading /> : null}

      {absences.error ? (
        <DashboardError
          title="Unable to load absences."
          message={absences.error}
          onRetry={absences.retry}
        />
      ) : null}

      {!absences.loading && !absences.error && absences.absences.length === 0 ? (
        <AbsenceEmptyState
          isEmployee={absences.isEmployee}
          canCreate={absences.canCreate}
          onAdd={openCreate}
        />
      ) : null}

      {!absences.loading && !absences.error && absences.absences.length > 0 ? (
        <AbsenceTable
          absences={absences.absences}
          canEdit={absences.canEdit}
          canDelete={absences.canDelete}
          canReview={absences.canReview}
          onEdit={openEdit}
          onDelete={(absence) => {
            setDeleteError(null);
            setDeleteTarget(absence);
          }}
          onApprove={(absence) => {
            setApproveError(null);
            setApproveTarget(absence);
          }}
          onReject={(absence) => {
            setRejectError(null);
            setRejectTarget(absence);
          }}
        />
      ) : null}

      <AbsenceModal
        open={modalOpen}
        mode={modalMode}
        initialValues={formInitialValues}
        employees={absences.isEmployee ? [] : absences.employees}
        employeeLocked={absences.isEmployee || modalMode === "edit"}
        employeeLabel={
          editing?.employee
            ? employeeDisplayName(editing.employee)
            : absences.isEmployee
              ? "Your employee profile"
              : undefined
        }
        editingAbsence={editing}
        busy={absences.mutating}
        error={formError}
        onClose={closeModal}
        onSubmit={(values) => void handleSubmit(values)}
      />

      <DeleteAbsenceDialog
        open={Boolean(deleteTarget)}
        busy={absences.mutating}
        error={deleteError}
        onCancel={() => {
          if (!absences.mutating) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
        onConfirm={() => void handleDelete()}
      />

      <ApproveAbsenceDialog
        open={Boolean(approveTarget)}
        busy={absences.mutating}
        error={approveError}
        onCancel={() => {
          if (!absences.mutating) {
            setApproveTarget(null);
            setApproveError(null);
          }
        }}
        onConfirm={() => void handleApprove()}
      />

      <RejectAbsenceDialog
        open={Boolean(rejectTarget)}
        busy={absences.mutating}
        error={rejectError}
        onCancel={() => {
          if (!absences.mutating) {
            setRejectTarget(null);
            setRejectError(null);
          }
        }}
        onConfirm={(reason) => void handleReject(reason)}
      />
    </div>
  );
}
