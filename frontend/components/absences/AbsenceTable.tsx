import { AbsenceStatusBadge } from "@/components/absences/AbsenceStatusBadge";
import { AbsenceTypeBadge } from "@/components/absences/AbsenceTypeBadge";
import { parseDateOnly } from "@/lib/date/weeks";
import { employeeDisplayName } from "@/lib/utilization";
import type { AbsenceResponse } from "@/types/absence.types";

type AbsenceTableProps = {
  absences: AbsenceResponse[];
  canEdit: boolean;
  canDelete: boolean;
  canReview: boolean;
  onEdit: (absence: AbsenceResponse) => void;
  onDelete: (absence: AbsenceResponse) => void;
  onApprove: (absence: AbsenceResponse) => void;
  onReject: (absence: AbsenceResponse) => void;
};

const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatAbsenceDate(value: string): string {
  const date = parseDateOnly(value);
  return `${String(date.getUTCDate()).padStart(2, "0")} ${SHORT_MONTHS[date.getUTCMonth()]}`;
}

function formatHours(hours: number): string {
  const rounded = Math.round(hours * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}h` : `${rounded.toFixed(1)}h`;
}

function employeeName(absence: AbsenceResponse): string {
  if (absence.employee) {
    return employeeDisplayName(absence.employee);
  }
  return absence.employeeId;
}

function canEditAbsence(absence: AbsenceResponse, canEdit: boolean) {
  return canEdit && absence.status !== "APPROVED";
}

function canDeleteAbsence(absence: AbsenceResponse, canDelete: boolean) {
  return canDelete;
}

function RowActions({
  absence,
  canEdit,
  canDelete,
  canReview,
  onEdit,
  onDelete,
  onApprove,
  onReject,
}: {
  absence: AbsenceResponse;
  canEdit: boolean;
  canDelete: boolean;
  canReview: boolean;
  onEdit: (absence: AbsenceResponse) => void;
  onDelete: (absence: AbsenceResponse) => void;
  onApprove: (absence: AbsenceResponse) => void;
  onReject: (absence: AbsenceResponse) => void;
}) {
  const editable = canEditAbsence(absence, canEdit);
  const deletable = canDeleteAbsence(absence, canDelete);
  const pendingReview = canReview && absence.status === "PENDING";

  if (!editable && !deletable && !pendingReview && !canReview) {
    return <span className="text-muted">—</span>;
  }

  if (canReview && absence.status !== "PENDING") {
    return (
      <div className="space-y-1">
        <AbsenceStatusBadge status={absence.status} />
        {absence.status === "REJECTED" && absence.rejectionReason ? (
          <p className="max-w-[14rem] text-xs text-muted">
            {absence.rejectionReason}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {pendingReview ? (
        <>
          <button
            type="button"
            onClick={() => onApprove(absence)}
            className="rounded-md bg-accent px-2.5 py-1.5 text-xs font-semibold text-accent-foreground hover:bg-accent-hover"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => onReject(absence)}
            className="rounded-md border border-utilization-critical/30 px-2.5 py-1.5 text-xs font-semibold text-utilization-critical hover:bg-utilization-critical/5"
          >
            Reject
          </button>
        </>
      ) : null}
      {editable ? (
        <button
          type="button"
          onClick={() => onEdit(absence)}
          className="rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-background"
        >
          Edit
        </button>
      ) : null}
      {deletable ? (
        <button
          type="button"
          onClick={() => onDelete(absence)}
          className="rounded-md border border-utilization-critical/30 px-2.5 py-1.5 text-xs font-semibold text-utilization-critical hover:bg-utilization-critical/5"
        >
          Delete
        </button>
      ) : null}
    </div>
  );
}

export function AbsenceTable({
  absences,
  canEdit,
  canDelete,
  canReview,
  onEdit,
  onDelete,
  onApprove,
  onReject,
}: AbsenceTableProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_8px_30px_rgba(88,70,180,0.06)]">
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-background/80 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="whitespace-nowrap px-4 py-3 font-semibold">
                Employee
              </th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold">Type</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold">Start</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold">End</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold">Hours</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold">
                Status
              </th>
              <th className="min-w-[10rem] px-4 py-3 font-semibold">Note</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {absences.map((absence) => (
              <tr
                key={absence.id}
                className="border-t border-border align-top hover:bg-background/60"
              >
                <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">
                  {employeeName(absence)}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <AbsenceTypeBadge type={absence.absenceType} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-foreground">
                  {formatAbsenceDate(absence.startDate)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-foreground">
                  {formatAbsenceDate(absence.endDate)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-foreground">
                  {formatHours(absence.hours)}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="space-y-1">
                    <AbsenceStatusBadge status={absence.status} />
                    {absence.status === "REJECTED" && absence.rejectionReason ? (
                      <p className="max-w-[12rem] text-xs text-muted">
                        Reason: {absence.rejectionReason}
                      </p>
                    ) : null}
                  </div>
                </td>
                <td className="max-w-xs px-4 py-3 text-muted">
                  {absence.note?.trim() ? absence.note : "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <RowActions
                    absence={absence}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    canReview={canReview}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onApprove={onApprove}
                    onReject={onReject}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-4 md:hidden">
        {absences.map((absence) => (
          <article
            key={`${absence.id}-card`}
            className="rounded-xl border border-border bg-background p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-foreground">
                  {employeeName(absence)}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <AbsenceTypeBadge type={absence.absenceType} />
                  <AbsenceStatusBadge status={absence.status} />
                </div>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {formatHours(absence.hours)}
              </p>
            </div>
            <p className="mt-3 text-sm text-muted">
              {formatAbsenceDate(absence.startDate)} –{" "}
              {formatAbsenceDate(absence.endDate)}
            </p>
            {absence.note?.trim() ? (
              <p className="mt-2 text-sm text-foreground">{absence.note}</p>
            ) : null}
            {absence.status === "REJECTED" && absence.rejectionReason ? (
              <p className="mt-2 text-sm text-utilization-critical">
                Reason: {absence.rejectionReason}
              </p>
            ) : null}
            <div className="mt-3">
              <RowActions
                absence={absence}
                canEdit={canEdit}
                canDelete={canDelete}
                canReview={canReview}
                onEdit={onEdit}
                onDelete={onDelete}
                onApprove={onApprove}
                onReject={onReject}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
