import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ArrowLeftIcon } from "@/components/auth/icons";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Create admin account",
};

export default function RegisterPage() {
  return (
    <AuthLayout wide>
      <AuthCard
        title="Create Admin Account"
        description="Set up the first administrator account to access the system"
      >
        <RegisterForm />
      </AuthCard>

      <p className="mt-5 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Login
        </Link>
      </p>
    </AuthLayout>
  );
}
