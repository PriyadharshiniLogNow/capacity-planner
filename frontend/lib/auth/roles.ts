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
      return "Management";
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

export function getNavItems(role: Role): NavItem[] {
  if (role === "ADMIN") {
    return [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/planning", label: "Planning" },
      { href: "/employees", label: "Employees" },
      { href: "/projects", label: "Projects" },
      { href: "/time-entries", label: "Time Entries" },
      { href: "/absences", label: "Absences" },
    ];
  }

  if (role === "EMPLOYEE") {
    return [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/planning", label: "My Planning" },
      { href: "/time-entries", label: "My Time Entries" },
      { href: "/absences", label: "My Absences" },
      { href: "/profile", label: "Profile" },
    ];
  }

  return [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/employees", label: "Employees" },
    { href: "/projects", label: "Projects" },
  ];
}

export function canAccessPath(role: Role, pathname: string): boolean {
  return getNavItems(role).some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
}
