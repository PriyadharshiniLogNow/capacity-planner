import type { Role } from "@/types/auth.types";

export type NavItem = {
  href: string;
  label: string;
};

export function getRoleLabel(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "Administrator / Planner";
    case "SUPERVISOR":
      return "Supervisor";
    case "EMPLOYEE":
      return "Employee";
  }
}

export function isPlannerRole(role: Role): boolean {
  return role === "ADMIN";
}

export function isManagementRole(role: Role): boolean {
  return role === "SUPERVISOR";
}

export function isEmployeeRole(role: Role): boolean {
  return role === "EMPLOYEE";
}

const ADMIN_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/planning", label: "Planning" },
  { href: "/time-entries", label: "Time Entry" },
  { href: "/projects", label: "Projects" },
  { href: "/employees", label: "Employees" },
  { href: "/absences", label: "Absences" },
];

const SUPERVISOR_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/planning", label: "Planning" },
  { href: "/time-entries", label: "Time Entry" },
  { href: "/projects", label: "Projects" },
  { href: "/employees", label: "Employees" },
  { href: "/absences", label: "Absences" },
];

const EMPLOYEE_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/planning", label: "Planning" },
  { href: "/time-entries", label: "Time Entry" },
  { href: "/projects", label: "Projects" },
  { href: "/absences", label: "My Absences" },
];

export function getNavItems(role: Role): NavItem[] {
  switch (role) {
    case "ADMIN":
      return ADMIN_NAV;
    case "SUPERVISOR":
      return SUPERVISOR_NAV;
    case "EMPLOYEE":
      return EMPLOYEE_NAV;
  }
}

export function canAccessPath(role: Role, pathname: string): boolean {
  if (pathname === "/profile" || pathname.startsWith("/profile/")) {
    return true;
  }

  return getNavItems(role).some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
}
