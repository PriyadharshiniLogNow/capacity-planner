"use client";

import type { ReactNode, SVGProps } from "react";
import {
  AbsenceNavIcon,
  CalendarNavIcon,
  ClockNavIcon,
  DashboardNavIcon,
  FolderNavIcon,
  UsersNavIcon,
} from "@/components/auth/icons";
import { getNavItems, getRoleLabel } from "@/lib/auth/roles";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type DashboardShellProps = {
  children: ReactNode;
};

type IconComponent = (props: SVGProps<SVGSVGElement>) => ReactNode;

const NAV_ICONS: Record<string, IconComponent> = {
  "/dashboard": DashboardNavIcon,
  "/planning": CalendarNavIcon,
  "/time-entries": ClockNavIcon,
  "/projects": FolderNavIcon,
  "/employees": UsersNavIcon,
  "/absences": AbsenceNavIcon,
};

function NavIcon({ href }: { href: string }) {
  const Icon = NAV_ICONS[href] ?? DashboardNavIcon;
  return <Icon className="h-4 w-4 shrink-0" />;
}

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
        <aside className="sticky top-0 hidden h-screen w-40 shrink-0 flex-col bg-sidebar text-sidebar-text lg:flex">
          <div className="px-4 pb-3 pt-5">
            <p className="text-[15px] font-bold leading-none tracking-[0.08em] text-white">
              LOG NOW
            </p>
            <p className="mt-1.5 text-[11px] font-normal leading-tight text-white/70">
              Capacity Planning
            </p>
          </div>
          <nav className="flex flex-1 flex-col gap-2 overflow-y-auto px-3.5 pt-2">
            {items.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "flex items-center gap-2 rounded-md px-2.5 py-2 text-[13px] transition",
                    active
                      ? "bg-sidebar-active font-semibold text-white"
                      : "font-medium text-sidebar-text hover:bg-sidebar-hover hover:text-white",
                  ].join(" ")}
                >
                  <NavIcon href={item.href} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-white/10 px-3.5 py-3">
            <Link
              href="/profile"
              title="Open profile"
              className={[
                "block truncate text-[12px] font-medium text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-active",
                pathname === "/profile" ? "underline" : "",
              ].join(" ")}
            >
              {user.email}
            </Link>
            <p className="text-[11px] text-sidebar-text">{getRoleLabel(user.role)}</p>
            <button
              type="button"
              onClick={signOut}
              className="mt-2 text-[12px] font-medium text-sidebar-text hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-active"
            >
              Sign out
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between bg-sidebar px-4 py-3 text-white lg:hidden">
            <div>
              <p className="text-[15px] font-bold tracking-[0.08em]">LOG NOW</p>
              <p className="text-[11px] text-white/70">Capacity Planning</p>
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
              <nav className="flex flex-col gap-2">
                {items.map((item) => {
                  const active =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={[
                        "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm",
                        active
                          ? "bg-sidebar-active font-semibold text-white"
                          : "font-medium text-sidebar-text hover:bg-sidebar-hover hover:text-white",
                      ].join(" ")}
                    >
                      <NavIcon href={item.href} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <Link
                href="/profile"
                title="Open profile"
                onClick={() => setMobileOpen(false)}
                className={[
                  "mt-3 block truncate px-2.5 text-sm font-medium hover:text-white hover:underline",
                  pathname === "/profile" ? "text-white" : "text-sidebar-text",
                ].join(" ")}
              >
                {user.email}
              </Link>
              <button
                type="button"
                onClick={signOut}
                className="mt-2 px-2.5 text-sm font-medium text-sidebar-text hover:text-white"
              >
                Sign out
              </button>
            </div>
          ) : null}

          <main className="min-w-0 flex-1 overflow-x-hidden px-4 py-3.5 sm:px-4 lg:px-4">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
