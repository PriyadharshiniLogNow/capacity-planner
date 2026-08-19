import {
  AbsenceForm,
  type AbsenceFormValues,
} from "@/components/absences/AbsenceForm";
import type { AbsenceResponse } from "@/types/absence.types";
import type { EmployeeResponse } from "@/types/employee.types";
import { useState } from "react";

type AbsenceModalProps = {
  open: boolean;
  mode: "create" | "edit";
  initialValues: AbsenceFormValues;
  employees: EmployeeResponse[];
  employeeLocked: boolean;
  employeeLabel?: string;
  editingAbsence?: AbsenceResponse | null;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: AbsenceFormValues) => void;
};

export function AbsenceModal({
  open,
  mode,
  initialValues,
  employees,
  employeeLocked,
  employeeLabel,
  editingAbsence,
  busy,
  error,
  onClose,
  onSubmit,
}: AbsenceModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4"
      role="presentation"
      onClick={busy ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="absence-modal-title"
        className="w-full max-w-lg rounded-md border border-border bg-surface p-5 shadow-[0_16px_40px_rgba(0,26,51,0.16)]"
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id="absence-modal-title"
          className="text-lg font-semibold text-foreground"
        >
          {mode === "create" ? "Add Absence" : "Edit Absence"}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {mode === "create"
            ? "Record an absence. Hours are calculated by the server from working days."
            : "Update this absence. Hours are recalculated by the server."}
        </p>

        <div className="mt-4">
          <AbsenceForm
            key={`${mode}-${editingAbsence?.id ?? "new"}-${initialValues.startDate}-${initialValues.employeeId}`}
            mode={mode}
            initialValues={initialValues}
            employees={employees}
            employeeLocked={employeeLocked}
            employeeLabel={employeeLabel}
            hoursDisplay={editingAbsence?.hours ?? null}
            busy={busy}
            error={error}
            onCancel={onClose}
            onSubmit={onSubmit}
          />
        </div>
      </div>
    </div>
  );
}

type DeleteAbsenceDialogProps = {
  open: boolean;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteAbsenceDialog({
  open,
  busy,
  error,
  onCancel,
  onConfirm,
}: DeleteAbsenceDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4"
      role="presentation"
      onClick={busy ? undefined : onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-absence-title"
        className="w-full max-w-md rounded-md border border-border bg-surface p-5 shadow-[0_16px_40px_rgba(0,26,51,0.16)]"
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id="delete-absence-title"
          className="text-lg font-semibold text-foreground"
        >
          Delete Absence
        </h2>
        <p className="mt-2 text-sm text-muted">
          Are you sure you want to delete this absence?
        </p>
        {error ? (
          <p className="mt-3 text-sm text-utilization-critical" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-background disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-md bg-utilization-critical px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

type ApproveAbsenceDialogProps = {
  open: boolean;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ApproveAbsenceDialog({
  open,
  busy,
  error,
  onCancel,
  onConfirm,
}: ApproveAbsenceDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4"
      role="presentation"
      onClick={busy ? undefined : onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="approve-absence-title"
        className="w-full max-w-md rounded-md border border-border bg-surface p-5 shadow-[0_16px_40px_rgba(0,26,51,0.16)]"
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id="approve-absence-title"
          className="text-lg font-semibold text-foreground"
        >
          Approve Leave Request
        </h2>
        <p className="mt-2 text-sm text-muted">
          Are you sure you want to approve this leave request?
        </p>
        {error ? (
          <p className="mt-3 text-sm text-utilization-critical" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-background disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
          >
            {busy ? "Approving..." : "Approve"}
          </button>
        </div>
      </div>
    </div>
  );
}

type RejectAbsenceDialogProps = {
  open: boolean;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: (rejectionReason: string) => void;
};

export function RejectAbsenceDialog({
  open,
  busy,
  error,
  onCancel,
  onConfirm,
}: RejectAbsenceDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <RejectAbsenceDialogInner
      busy={busy}
      error={error}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}

function RejectAbsenceDialogInner({
  busy,
  error,
  onCancel,
  onConfirm,
}: Omit<RejectAbsenceDialogProps, "open">) {
  const [reason, setReason] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4"
      role="presentation"
      onClick={busy ? undefined : onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reject-absence-title"
        className="w-full max-w-md rounded-md border border-border bg-surface p-5 shadow-[0_16px_40px_rgba(0,26,51,0.16)]"
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id="reject-absence-title"
          className="text-lg font-semibold text-foreground"
        >
          Reject Leave Request
        </h2>
        <label className="mt-4 block text-sm">
          <span className="mb-1.5 block font-medium text-foreground">
            Reason for rejection
          </span>
          <textarea
            rows={4}
            maxLength={1000}
            disabled={busy}
            value={reason}
            onChange={(event) => {
              setLocalError(null);
              setReason(event.target.value);
            }}
            className="w-full rounded-md border border-border px-3 py-2 text-sm focus-visible:border-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:bg-background"
            placeholder="Explain why this leave request is rejected"
          />
        </label>
        {localError || error ? (
          <p className="mt-3 text-sm text-utilization-critical" role="alert">
            {localError || error}
          </p>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-background disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              const trimmed = reason.trim();
              if (!trimmed) {
                setLocalError("Rejection reason is required.");
                return;
              }
              onConfirm(trimmed);
            }}
            disabled={busy}
            className="rounded-md bg-utilization-critical px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Rejecting..." : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}
