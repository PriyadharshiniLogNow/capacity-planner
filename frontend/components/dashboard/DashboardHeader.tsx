type DashboardHeaderProps = {
  title: string;
  description: string;
};

export function DashboardHeader({ title, description }: DashboardHeaderProps) {
  return (
    <div className="mb-3">
      <h1 className="text-[26px] font-bold leading-tight text-foreground">
        {title}
      </h1>
      <p className="mt-0.5 text-[13px] text-muted">{description}</p>
    </div>
  );
}
