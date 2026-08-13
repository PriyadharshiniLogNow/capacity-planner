"use client";

import { register as registerRequest } from "@/lib/api/auth.api";
import { ApiError } from "@/lib/api/client";
import { getStoredToken } from "@/lib/auth/storage";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type FormEvent } from "react";
import { AuthTextInput } from "./AuthTextInput";
import { MailIcon, ShieldIcon, SpinnerIcon, UserIcon } from "./icons";
import { PasswordInput } from "./PasswordInput";

type FieldErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

function registerErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 409 || error.code === "EMAIL_ALREADY_EXISTS") {
      return "This email is already registered.";
    }
    if (error.status === 422) {
      return error.message || "Please check the highlighted fields.";
    }
    if (error.message && error.status < 500) {
      return error.message;
    }
    return "Unable to create administrator account.";
  }

  return "Something went wrong. Please try again.";
}

export function RegisterForm() {
  const router = useRouter();
  const id = useId();

  const firstNameId = `${id}-first-name`;
  const lastNameId = `${id}-last-name`;
  const emailId = `${id}-email`;
  const passwordId = `${id}-password`;
  const confirmPasswordId = `${id}-confirm-password`;
  const roleId = `${id}-role`;
  const formErrorId = `${id}-form-error`;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (getStoredToken()) {
      router.replace("/dashboard");
    }
  }, [router]);

  function clearFieldError(field: keyof FieldErrors) {
    if (fieldErrors[field]) {
      setFieldErrors((current) => ({ ...current, [field]: undefined }));
    }
  }

  function validate(): FieldErrors {
    const errors: FieldErrors = {};

    if (!firstName.trim()) {
      errors.firstName = "First name is required.";
    }

    if (!lastName.trim()) {
      errors.lastName = "Last name is required.";
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errors.email = "Email address is required.";
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      errors.email = "Enter a valid email address.";
    }

    if (!password) {
      errors.password = "Password is required.";
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    } else if (password.length > MAX_PASSWORD_LENGTH) {
      errors.password = `Password must be at most ${MAX_PASSWORD_LENGTH} characters.`;
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Confirm your password.";
    } else if (confirmPassword !== password) {
      errors.confirmPassword = "Passwords do not match.";
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

    if (Object.values(errors).some(Boolean)) {
      return;
    }

    setIsSubmitting(true);

    try {
      await registerRequest({
        email: email.trim(),
        password,
        role: "ADMIN",
      });

      router.replace("/login?registered=1");
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors) {
        const next: FieldErrors = {};
        if (error.fieldErrors.email?.[0]) {
          next.email = error.fieldErrors.email[0];
        }
        if (error.fieldErrors.password?.[0]) {
          next.password = error.fieldErrors.password[0];
        }
        if (next.email || next.password) {
          setFieldErrors(next);
        }
      }
      setFormError(registerErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {formError ? (
        <p
          id={formErrorId}
          role="alert"
          className="rounded-xl border border-utilization-critical/20 bg-utilization-critical/5 px-3 py-2.5 text-sm text-utilization-critical"
        >
          {formError}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AuthTextInput
          id={firstNameId}
          label="First Name"
          name="firstName"
          autoComplete="given-name"
          required
          value={firstName}
          disabled={isSubmitting}
          placeholder="Enter first name"
          error={fieldErrors.firstName}
          errorId={`${id}-first-name-error`}
          icon={<UserIcon />}
          onChange={(event) => {
            setFirstName(event.target.value);
            clearFieldError("firstName");
          }}
        />
        <AuthTextInput
          id={lastNameId}
          label="Last Name"
          name="lastName"
          autoComplete="family-name"
          required
          value={lastName}
          disabled={isSubmitting}
          placeholder="Enter last name"
          error={fieldErrors.lastName}
          errorId={`${id}-last-name-error`}
          icon={<UserIcon />}
          onChange={(event) => {
            setLastName(event.target.value);
            clearFieldError("lastName");
          }}
        />
      </div>

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
        errorId={`${id}-email-error`}
        icon={<MailIcon />}
        onChange={(event) => {
          setEmail(event.target.value);
          clearFieldError("email");
        }}
      />

      <PasswordInput
        id={passwordId}
        label="Password"
        value={password}
        autoComplete="new-password"
        placeholder="Create a password"
        disabled={isSubmitting}
        error={fieldErrors.password}
        errorId={`${id}-password-error`}
        hint="Must be at least 8 characters."
        onChange={(value) => {
          setPassword(value);
          clearFieldError("password");
        }}
      />

      <PasswordInput
        id={confirmPasswordId}
        label="Confirm Password"
        value={confirmPassword}
        autoComplete="new-password"
        placeholder="Re-enter your password"
        disabled={isSubmitting}
        error={fieldErrors.confirmPassword}
        errorId={`${id}-confirm-password-error`}
        onChange={(value) => {
          setConfirmPassword(value);
          clearFieldError("confirmPassword");
        }}
      />

      <AuthTextInput
        id={roleId}
        label="Role"
        name="role"
        readOnly
        value="Administrator"
        icon={<ShieldIcon />}
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground shadow-[0_10px_24px_rgba(108,76,232,0.28)] transition hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? (
          <>
            <SpinnerIcon />
            Creating account...
          </>
        ) : (
          "Create Admin Account"
        )}
      </button>
    </form>
  );
}
