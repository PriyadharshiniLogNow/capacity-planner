"use client";

import type { ReactNode } from "react";
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
        <aside className="hidden w-56 shrink-0 bg-sidebar text-sidebar-text lg:flex lg:flex-col">
          <div className="px-5 pb-4 pt-6">
            <div className="flex items-start gap-1.5">
              <img
                src="/lognow-logo.png?v=2"
                alt="LogNow"
                width={28}
                height={28}
                className="mt-0.5 h-7 w-7 shrink-0 object-contain"
              />
              <div className="text-left">
                <p className="text-lg font-bold tracking-[0.18em] text-accent">
                  LOGNOW
                </p>
                <p className="text-sm font-bold text-white">Capacity Planner</p>
              </div>
            </div>
          </div>
          <nav className="flex flex-1 flex-col gap-0.5 px-3 pt-2">
            {items.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "rounded-md px-3 py-2 text-[13px] font-medium transition",
                    active
                      ? "bg-sidebar-active text-white"
                      : "text-sidebar-text hover:bg-sidebar-hover hover:text-white",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-white/10 p-4">
            <p className="truncate text-sm font-medium text-white">{user.email}</p>
            <p className="text-xs text-sidebar-text">{getRoleLabel(user.role)}</p>
            <button
              type="button"
              onClick={signOut}
              className="mt-3 text-sm font-medium text-sidebar-text hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-active"
            >
              Sign out
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between bg-sidebar px-4 py-3 text-white lg:hidden">
            <div className="flex items-start gap-1.5">
              <img
                src="/lognow-logo.png?v=2"
                alt="LogNow"
                width={28}
                height={28}
                className="mt-0.5 h-7 w-7 shrink-0 object-contain"
              />
              <div className="text-left">
                <p className="text-lg font-bold tracking-[0.18em] text-accent">
                  LOGNOW
                </p>
                <p className="text-sm font-bold text-white">Capacity Planner</p>
              </div>
            </div>
            <button
              type="button"
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileOpen((open) => !open)}
              className="rounded-md border border-white/20 px-3 py-1.5 text-sm text-white"
            >
              Menu
            </button>
          </header>

          {mobileOpen ? (
            <div className="bg-sidebar px-3 py-3 lg:hidden">
              <nav className="flex flex-col gap-0.5">
                {items.map((item) => {
                  const active =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={[
                        "rounded-md px-3 py-2 text-sm font-medium",
                        active
                          ? "bg-sidebar-active text-white"
                          : "text-sidebar-text hover:bg-sidebar-hover hover:text-white",
                      ].join(" ")}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <button
                type="button"
                onClick={signOut}
                className="mt-3 px-3 text-sm font-medium text-sidebar-text hover:text-white"
              >
                Sign out
              </button>
            </div>
          ) : null}

          <main className="min-w-0 flex-1 overflow-x-hidden px-4 py-4 sm:px-5 lg:px-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
