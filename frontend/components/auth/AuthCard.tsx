import type { ReactNode } from "react";

type AuthCardProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <section className="w-full rounded-[1.5rem] border border-white/80 bg-surface p-5 shadow-[0_16px_48px_rgba(88,70,180,0.12)] sm:p-8">
      <div className="mb-6 text-center sm:mb-7">
        <h1 className="text-[1.65rem] font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}
