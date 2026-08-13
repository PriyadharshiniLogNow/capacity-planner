"use client";

import type { ReactNode } from "react";
import { BrandMarkIcon } from "@/components/auth/icons";
import { getNavItems, getRoleLabel } from "@/lib/auth/roles";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type DashboardShellProps = {
  children: ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  const { user, token, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, [token, router]);

  if (!token || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted">
        Checking session...
      </div>
    );
  }

  const items = getNavItems(user.role);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-border bg-surface lg:flex lg:flex-col">
          <div className="flex items-center gap-3 px-5 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <BrandMarkIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-[0.16em] text-foreground">
                LOGNOW
              </p>
              <p className="text-xs text-muted">Capacity Planner</p>
            </div>
          </div>
          <nav className="flex flex-1 flex-col gap-1 px-3 pb-6">
            {items.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "rounded-xl px-3 py-2.5 text-sm font-medium transition",
                    active
                      ? "bg-accent-soft text-accent"
                      : "text-muted hover:bg-accent-soft/60 hover:text-foreground",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-border p-4">
            <p className="truncate text-sm font-medium text-foreground">{user.email}</p>
            <p className="text-xs text-muted">{getRoleLabel(user.role)}</p>
            <button
              type="button"
              onClick={signOut}
              className="mt-3 text-sm font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Sign out
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <BrandMarkIcon className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold tracking-[0.14em]">LOGNOW</span>
            </div>
            <button
              type="button"
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileOpen((open) => !open)}
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground"
            >
              Menu
            </button>
          </header>

          {mobileOpen ? (
            <div className="border-b border-border bg-surface px-3 py-3 lg:hidden">
              <nav className="flex flex-col gap-1">
                {items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-accent-soft"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <button
                type="button"
                onClick={signOut}
                className="mt-3 px-3 text-sm font-medium text-accent"
              >
                Sign out
              </button>
            </div>
          ) : null}

          <main className="min-w-0 flex-1 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
