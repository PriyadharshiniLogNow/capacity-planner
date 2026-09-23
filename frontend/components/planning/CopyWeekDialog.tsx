type CopyWeekDialogProps = {
  open: boolean;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export function CopyWeekDialog({
  open,
  busy,
  error,
  onCancel,
  onConfirm,
}: CopyWeekDialogProps) {
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
        aria-labelledby="copy-week-title"
        className="w-full max-w-md rounded-md border border-border bg-surface p-5 shadow-[0_16px_40px_rgba(0,26,51,0.16)]"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="copy-week-title" className="text-lg font-semibold text-foreground">
          Copy Week
        </h2>
        <p className="mt-2 text-sm text-muted">
          Copy all planned project hours from the current week to the next week?
        </p>
        <p className="mt-2 text-sm text-muted">
          Hours are not copied onto non-working days, public holidays, approved
          absences, or dates outside employee or project validity.
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
            {busy ? "Copying..." : "Copy Week"}
          </button>
        </div>
      </div>
    </div>
  );
}
