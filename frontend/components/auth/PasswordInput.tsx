"use client";

import { useState, type ReactNode } from "react";
import { AuthTextInput } from "./AuthTextInput";
import { EyeIcon, EyeOffIcon, LockIcon } from "./icons";

type PasswordInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
  errorId?: string;
  disabled?: boolean;
  hint?: string;
  labelExtra?: ReactNode;
};

export function PasswordInput({
  id,
  label,
  value,
  onChange,
  placeholder = "Enter your password",
  autoComplete,
  error,
  errorId,
  disabled,
  hint,
  labelExtra,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <AuthTextInput
      id={id}
      label={label}
      type={visible ? "text" : "password"}
      value={value}
      placeholder={placeholder}
      autoComplete={autoComplete}
      spellCheck={false}
      required
      disabled={disabled}
      error={error}
      errorId={errorId}
      hint={hint}
      labelExtra={labelExtra}
      icon={<LockIcon />}
      onChange={(event) => onChange(event.target.value)}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          disabled={disabled}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="rounded-lg p-2 text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      }
    />
  );
}
