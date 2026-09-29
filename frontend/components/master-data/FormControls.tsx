import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

const controlClassName = [
  "w-full rounded-md border bg-surface px-3 py-2 text-sm text-foreground",
  "placeholder:text-muted",
  "transition-colors",
  "enabled:hover:border-[#93c5fd]",
  "focus-visible:border-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent",
  "disabled:cursor-not-allowed disabled:bg-background disabled:text-muted",
  "read-only:bg-background read-only:text-muted",
].join(" ");

type FieldWrapProps = {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
};

export function FieldWrap({
  id,
  label,
  required,
  error,
  hint,
  children,
}: FieldWrapProps) {
  const errorId = `${id}-error`;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[13px] font-medium text-foreground">
        {label}
        {required ? (
          <span className="ml-0.5 text-utilization-critical" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p id={errorId} role="alert" className="text-[12px] font-medium text-utilization-critical">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[11px] text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

type FormInputProps = {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: ReactNode;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className">;

export function FormInput({
  id,
  label,
  required,
  error,
  hint,
  ...inputProps
}: FormInputProps) {
  return (
    <FieldWrap id={id} label={label} required={required} error={error} hint={hint}>
      <input
        {...inputProps}
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={[
          controlClassName,
          error ? "border-utilization-critical" : "border-border",
        ].join(" ")}
      />
    </FieldWrap>
  );
}

type FormSelectProps = {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "id" | "className">;

export function FormSelect({
  id,
  label,
  required,
  error,
  hint,
  children,
  ...selectProps
}: FormSelectProps) {
  return (
    <FieldWrap id={id} label={label} required={required} error={error} hint={hint}>
      <select
        {...selectProps}
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={[
          controlClassName,
          error ? "border-utilization-critical" : "border-border",
        ].join(" ")}
      >
        {children}
      </select>
    </FieldWrap>
  );
}

/** Compact inline filter control matching the Planning page toolbar. */
const filterControlClassName = [
  "h-8 rounded border border-border bg-surface px-2 text-[13px] text-foreground",
  "placeholder:text-muted",
  "transition-colors hover:border-[#93c5fd]",
  "focus-visible:border-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent",
].join(" ");

/** Bordered toolbar button matching the Planning page navigator. */
const pagerButtonClassName = [
  "h-8 rounded border border-border bg-surface px-3 text-[13px] font-medium text-foreground",
  "transition-colors hover:border-[#93c5fd] hover:bg-[#eff6ff]",
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent",
  "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:bg-surface",
].join(" ");

/** Primary (blue) action button, e.g. "New employee", "Save". */
const primaryButtonClassName = [
  "inline-flex h-8 items-center justify-center gap-2 rounded bg-accent px-3 text-[13px] font-semibold text-accent-foreground",
  "shadow-[0_1px_2px_rgba(0,26,51,0.12)] transition-colors hover:bg-accent-hover",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-1",
  "disabled:cursor-not-allowed disabled:opacity-50",
].join(" ");

/** Secondary (bordered) action button, e.g. "Cancel", "Close". */
const secondaryButtonClassName = [
  "inline-flex h-8 items-center justify-center rounded border border-border bg-surface px-3 text-[13px] font-semibold text-foreground",
  "transition-colors hover:border-[#93c5fd] hover:bg-[#eff6ff]",
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent",
].join(" ");

/** Inline row action (View / Edit) styled as a small blue chip with hover fill. */
const rowActionClassName = [
  "inline-flex h-7 items-center rounded border border-transparent px-2 text-[12px] font-semibold text-accent",
  "transition-colors hover:border-[#93c5fd] hover:bg-[#eff6ff]",
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent",
].join(" ");

/** Monospace identifier chip for Employee ID / Project ID columns. */
const codeChipClassName =
  "inline-flex items-center rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[12px] font-semibold tabular-nums text-foreground";

export {
  codeChipClassName,
  controlClassName,
  filterControlClassName,
  pagerButtonClassName,
  primaryButtonClassName,
  rowActionClassName,
  secondaryButtonClassName,
};
