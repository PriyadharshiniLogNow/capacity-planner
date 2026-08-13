import type { InputHTMLAttributes, ReactNode } from "react";

type AuthTextInputProps = {
  id: string;
  label: string;
  error?: string;
  errorId?: string;
  icon?: ReactNode;
  trailing?: ReactNode;
  hint?: ReactNode;
  labelExtra?: ReactNode;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className">;

export function AuthTextInput({
  id,
  label,
  error,
  errorId,
  icon,
  trailing,
  hint,
  labelExtra,
  ...inputProps
}: AuthTextInputProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="block text-sm font-medium text-foreground">
          {label}
        </label>
        {labelExtra}
      </div>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted">
            {icon}
          </span>
        ) : null}
        <input
          {...inputProps}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={[
            "w-full rounded-xl border bg-surface py-3 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]",
            "placeholder:text-muted/80",
            "transition-[border-color,box-shadow] duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent",
            "disabled:cursor-not-allowed disabled:opacity-60",
            "read-only:bg-accent-soft/60 read-only:text-foreground",
            icon ? "pl-11" : "pl-3.5",
            trailing ? "pr-11" : "pr-3.5",
            error ? "border-utilization-critical" : "border-border",
          ].join(" ")}
        />
        {trailing ? (
          <div className="absolute inset-y-0 right-0 flex items-center pr-1.5">
            {trailing}
          </div>
        ) : null}
      </div>
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
