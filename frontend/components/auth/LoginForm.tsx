"use client";

import { login as loginRequest } from "@/lib/api/auth.api";
import { ApiError } from "@/lib/api/client";
import { getStoredToken, persistAuth } from "@/lib/auth/storage";
import type { LoginResponse } from "@/types/auth.types";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type FormEvent } from "react";
import { AuthTextInput } from "./AuthTextInput";
import { MailIcon, SpinnerIcon } from "./icons";
import { PasswordInput } from "./PasswordInput";

type FieldErrors = {
  email?: string;
  password?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isLoginResponse(data: LoginResponse): data is LoginResponse {
  return Boolean(data?.token) && Boolean(data?.user?.id) && Boolean(data?.user?.email);
}

function loginErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return "Invalid email or password.";
    }
    if (error.status === 422) {
      return error.message || "Please check your email and password.";
    }
    if (error.message && error.status < 500) {
      return error.message;
    }
    return "Unable to sign in. Please try again.";
  }

  return "Something went wrong. Please try again.";
}

type LoginFormProps = {
  registered?: boolean;
};

export function LoginForm({ registered = false }: LoginFormProps) {
  const router = useRouter();
  const id = useId();
  const emailId = `${id}-email`;
  const passwordId = `${id}-password`;
  const emailErrorId = `${id}-email-error`;
  const passwordErrorId = `${id}-password-error`;
  const formErrorId = `${id}-form-error`;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (getStoredToken()) {
      router.replace("/dashboard");
    }
  }, [router]);

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      errors.email = "Email address is required.";
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      errors.email = "Enter a valid email address.";
    }

    if (!password) {
      errors.password = "Password is required.";
    }

    return errors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    const errors = validate();
    setFieldErrors(errors);
    setFormError(null);

    if (errors.email || errors.password) {
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await loginRequest({
        email: email.trim(),
        password,
      });

      if (!isLoginResponse(data)) {
        setFormError("Unable to sign in. Please try again.");
        return;
      }

      persistAuth(data.token, data.user);
      router.replace("/dashboard");
    } catch (error) {
      setFormError(loginErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {registered ? (
        <p
          role="status"
          className="rounded-xl border border-accent/20 bg-accent-soft px-3 py-2.5 text-sm text-foreground"
        >
          Administrator account created. Sign in to continue.
        </p>
      ) : null}

      {formError ? (
        <p
          id={formErrorId}
          role="alert"
          className="rounded-xl border border-utilization-critical/20 bg-utilization-critical/5 px-3 py-2.5 text-sm text-utilization-critical"
        >
          {formError}
        </p>
      ) : null}

      <AuthTextInput
        id={emailId}
        label="Email Address"
        type="email"
        name="email"
        autoComplete="email"
        inputMode="email"
        spellCheck={false}
        required
        value={email}
        disabled={isSubmitting}
        placeholder="Enter your email"
        error={fieldErrors.email}
        errorId={emailErrorId}
        icon={<MailIcon />}
        onChange={(event) => {
          setEmail(event.target.value);
          if (fieldErrors.email) {
            setFieldErrors((current) => ({ ...current, email: undefined }));
          }
        }}
      />

      <PasswordInput
        id={passwordId}
        label="Password"
        value={password}
        autoComplete="current-password"
        placeholder="Enter your password"
        disabled={isSubmitting}
        error={fieldErrors.password}
        errorId={passwordErrorId}
        labelExtra={
          <span className="text-sm font-medium text-accent">Forgot password?</span>
        }
        onChange={(value) => {
          setPassword(value);
          if (fieldErrors.password) {
            setFieldErrors((current) => ({ ...current, password: undefined }));
          }
        }}
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground shadow-[0_10px_24px_rgba(108,76,232,0.28)] transition hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? (
          <>
            <SpinnerIcon />
            Signing in...
          </>
        ) : (
          "Sign In"
        )}
      </button>
    </form>
  );
}
