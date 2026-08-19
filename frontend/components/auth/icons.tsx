import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function iconProps({ className, ...props }: IconProps): IconProps {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    className: ["h-5 w-5", className].filter(Boolean).join(" "),
    ...props,
  };
}

export function MailIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5.5 19.5c1.4-3 3.7-4.5 6.5-4.5s5.1 1.5 6.5 4.5" />
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M12 3.5 5.5 6.2v5.3c0 4 2.7 6.7 6.5 8.5 3.8-1.8 6.5-4.5 6.5-8.5V6.2L12 3.5Z" />
      <path d="m9.2 12.2 1.9 1.9 3.8-4" />
    </svg>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 11v5" />
      <circle cx="12" cy="8" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M2.5 12.5C4.3 8.4 7.8 6 12 6s7.7 2.4 9.5 6.5c-1.8 4.1-5.3 6.5-9.5 6.5S4.3 16.6 2.5 12.5Z" />
      <circle cx="12" cy="12.5" r="2.75" />
    </svg>
  );
}

export function EyeOffIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M3 3 21 21" />
      <path d="M10.6 10.7a2.75 2.75 0 0 0 3.7 3.7" />
      <path d="M9.7 5.4A10 10 0 0 1 12 5.2c4.2 0 7.7 2.4 9.5 6.5a12 12 0 0 1-1.9 3.4" />
      <path d="M6.4 6.6C4.4 8 2.9 10 2.5 12.5 4.3 16.6 7.8 19 12 19c1.7 0 3.3-.4 4.8-1.1" />
    </svg>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M19 12H5" />
      <path d="m11 6-6 6 6 6" />
    </svg>
  );
}

export function SpinnerIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={["h-5 w-5 animate-spin", props.className].filter(Boolean).join(" ")}
    >
      <circle
        cx="12"
        cy="12"
        r="8.5"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="2.5"
      />
      <path
        d="M20.5 12a8.5 8.5 0 0 0-8.5-8.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BrandMarkIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={["h-7 w-7", props.className].filter(Boolean).join(" ")}
    >
      <rect x="4" y="5" width="7" height="6" rx="1.4" fill="currentColor" opacity="0.95" />
      <rect x="13" y="5" width="7" height="6" rx="1.4" fill="currentColor" opacity="0.7" />
      <rect x="4" y="13" width="7" height="6" rx="1.4" fill="currentColor" opacity="0.7" />
      <rect x="13" y="13" width="7" height="6" rx="1.4" fill="currentColor" opacity="0.45" />
    </svg>
  );
}

function navIconProps({ className, ...props }: IconProps): IconProps {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    className: ["h-4 w-4 shrink-0", className].filter(Boolean).join(" "),
    ...props,
  };
}

export function DashboardNavIcon(props: IconProps) {
  return (
    <svg {...navIconProps(props)}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.2" />
    </svg>
  );
}

export function CalendarNavIcon(props: IconProps) {
  return (
    <svg {...navIconProps(props)}>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M8 3.5v3M16 3.5v3M3.5 10h17" />
    </svg>
  );
}

export function ClockNavIcon(props: IconProps) {
  return (
    <svg {...navIconProps(props)}>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 8v4.5l3 1.5" />
    </svg>
  );
}

export function FolderNavIcon(props: IconProps) {
  return (
    <svg {...navIconProps(props)}>
      <path d="M3.5 7.5h6l2 2h9v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 2.5 19V9A1.5 1.5 0 0 1 4 7.5Z" />
    </svg>
  );
}

export function UsersNavIcon(props: IconProps) {
  return (
    <svg {...navIconProps(props)}>
      <circle cx="9" cy="8.5" r="2.75" />
      <path d="M4.5 18c.6-2.8 2.3-4.2 4.5-4.2s3.9 1.4 4.5 4.2" />
      <circle cx="16.5" cy="9" r="2.25" />
      <path d="M15.2 13.9c1.7.3 3.1 1.5 3.8 4.1" />
    </svg>
  );
}

export function AbsenceNavIcon(props: IconProps) {
  return (
    <svg {...navIconProps(props)}>
      <circle cx="12" cy="12" r="3.25" />
      <path d="M12 5.5v1.5M12 17v1.5M5.5 12h1.5M17 12h1.5M7.4 7.4l1.1 1.1M15.5 15.5l1.1 1.1M7.4 16.6l1.1-1.1M15.5 8.5l1.1-1.1" />
    </svg>
  );
}

export function ProfileNavIcon(props: IconProps) {
  return (
    <svg {...navIconProps(props)}>
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5.5 19.5c1.4-3 3.7-4.5 6.5-4.5s5.1 1.5 6.5 4.5" />
    </svg>
  );
}
