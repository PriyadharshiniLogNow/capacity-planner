import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string | string[] }>;
}) {
  const params = await searchParams;
  const registered = params.registered === "1";

  return (
    <AuthLayout>
      <AuthCard
        title="Welcome Back"
        description="Sign in to continue to LogNow Capacity Planner."
      >
        <LoginForm registered={registered} />
      </AuthCard>

      <p className="mt-5 text-center text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          Create admin account
        </Link>
      </p>


    </AuthLayout>
  );
}
