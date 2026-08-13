import type { ReactNode } from "react";
import { BrandMarkIcon } from "./icons";

type AuthLayoutProps = {
  children: ReactNode;
  wide?: boolean;
};

export function AuthLayout({ children, wide = false }: AuthLayoutProps) {
  return (
    <div className="relative isolate min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -right-24 -top-28 h-[28rem] w-[28rem] rounded-full bg-accent/15" />
        <div className="absolute -bottom-32 -left-20 h-[24rem] w-[24rem] rounded-full bg-accent/10" />
        <div className="absolute bottom-24 right-[18%] h-40 w-40 rounded-full bg-accent/10" />
        <div className="absolute left-[12%] top-28 h-24 w-24 rounded-full bg-accent/10" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col px-4 py-8 sm:px-6 sm:py-12">
        <div
          className={[
            "mx-auto flex w-full flex-1 flex-col items-center justify-center",
            wide ? "max-w-[32rem]" : "max-w-[28rem]",
          ].join(" ")}
        >
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-[0_8px_20px_rgba(108,76,232,0.28)]">
                <BrandMarkIcon />
              </div>
              <div className="text-left">
                <p className="text-lg font-bold tracking-[0.18em] text-foreground">
                  LOGNOW
                </p>
                <p className="text-sm text-muted">Capacity Planner</p>
              </div>
            </div>
          </div>

          {children}
        </div>

        <footer className="mt-10 text-center text-xs text-muted">
          © {new Date().getFullYear()} LogNow. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
