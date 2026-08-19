type DashboardHeaderProps = {
  title: string;
  description: string;
};

export function DashboardHeader({ title, description }: DashboardHeaderProps) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[21px] font-bold leading-tight tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-0.5 text-[12px] leading-snug text-muted">{description}</p>
      </div>
    </div>
  );
}
