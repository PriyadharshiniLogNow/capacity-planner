"use client";

import { canAccessPath } from "@/lib/auth/roles";
import { useAuth } from "@/hooks/useAuth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

type ModulePlaceholderProps = {
  title: string;
  description: string;
};

export function ModulePlaceholder({ title, description }: ModulePlaceholderProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (user && !canAccessPath(user.role, pathname)) {
      router.replace("/dashboard");
    }
  }, [user, pathname, router]);

  if (!user || !canAccessPath(user.role, pathname)) {
    return null;
  }

  return (
    <section className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-[0_8px_30px_rgba(88,70,180,0.06)]">
      <p className="text-xs font-semibold tracking-[0.16em] text-accent">LOGNOW</p>
      <h1 className="mt-2 text-2xl font-semibold text-foreground">{title}</h1>
      <p className="mt-2 text-sm text-muted">{description}</p>
    </section>
  );
}
