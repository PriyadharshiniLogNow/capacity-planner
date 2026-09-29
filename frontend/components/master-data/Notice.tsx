type NoticeProps = {
  tone: "success" | "error";
  children: string;
};

export function Notice({ tone, children }: NoticeProps) {
  const isError = tone === "error";

  return (
    <p
      role={isError ? "alert" : "status"}
      className={[
        "rounded-md border border-l-[3px] px-3 py-2 text-[13px] font-medium",
        isError
          ? "border-[#fca5a5] border-l-[#dc2626] bg-[#fef2f2] text-[#b91c1c]"
          : "border-[#86efac] border-l-[#16a34a] bg-[#f0fdf4] text-[#15803d]",
      ].join(" ")}
    >
      {children}
    </p>
  );
}

/**
 * Badge tones mirror the Planning grid palette:
 * green = active / customer, blue = internal / info, amber = highlight,
 * purple = classification, neutral = inactive / closed.
 */
export type BadgeTone =
  | "active"
  | "inactive"
  | "green"
  | "blue"
  | "amber"
  | "purple"
  | "neutral";

const badgeToneClass: Record<BadgeTone, string> = {
  active: "border-[#86efac] bg-[#f0fdf4] text-[#15803d]",
  green: "border-[#86efac] bg-[#f0fdf4] text-[#15803d]",
  blue: "border-[#93c5fd] bg-[#eff6ff] text-[#1d4ed8]",
  amber: "border-[#fcd34d] bg-[#fffbeb] text-[#b45309]",
  purple: "border-[#c4b5fd] bg-[#f5f3ff] text-[#6d28d9]",
  inactive: "border-[#d1d5db] bg-[#f3f4f6] text-[#4b5563]",
  neutral: "border-[#d1d5db] bg-[#f3f4f6] text-[#4b5563]",
};

type StatusBadgeProps = {
  label: string;
  tone: BadgeTone;
  /** Show a small leading dot; used for lifecycle status (Active / Inactive / Closed). */
  dot?: boolean;
};

export function StatusBadge({ label, tone, dot = false }: StatusBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium",
        badgeToneClass[tone],
      ].join(" ")}
    >
      {dot ? (
        <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      ) : null}
      {label}
    </span>
  );
}
