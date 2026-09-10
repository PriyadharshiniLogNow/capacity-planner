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
        "rounded-xl border px-3 py-2.5 text-sm",
        isError
          ? "border-utilization-critical/20 bg-utilization-critical/5 text-utilization-critical"
          : "border-utilization-well/20 bg-utilization-well/5 text-utilization-well",
      ].join(" ")}
    >
      {children}
    </p>
  );
}

type StatusBadgeProps = {
  label: string;
  tone: "active" | "inactive";
};

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  return (
    <span
      className={[
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        tone === "active"
          ? "bg-utilization-well/15 text-utilization-well"
          : "bg-muted/15 text-muted",
      ].join(" ")}
    >
      {label}
    </span>
  );
}
