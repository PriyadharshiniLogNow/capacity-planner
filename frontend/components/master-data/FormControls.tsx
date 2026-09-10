import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

const controlClassName = [
  "w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm text-foreground",
  "placeholder:text-muted/80",
  "transition-[border-color,box-shadow] duration-150",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent",
  "disabled:cursor-not-allowed disabled:opacity-60",
  "read-only:bg-accent-soft/60",
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
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
        {required ? (
          <span className="ml-0.5 text-utilization-critical" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-utilization-critical">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
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

export { controlClassName };
