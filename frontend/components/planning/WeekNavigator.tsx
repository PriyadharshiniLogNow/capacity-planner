import { formatWeekRange } from "@/lib/date/weeks";

type WeekNavigatorProps = {
  weekStarts: string[];
  weekStart: string;
  weekIndex: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  onChange: (weekStart: string) => void;
};

const controlClassName =
  "h-8 rounded border border-border bg-surface px-2 text-sm text-foreground hover:bg-background disabled:cursor-not-allowed disabled:opacity-40";

export function WeekNavigator({
  weekStarts,
  weekStart,
  weekIndex,
  canGoPrev,
  canGoNext,
  onChange,
}: WeekNavigatorProps) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 text-[13px] font-medium text-foreground">Week:</span>
      <button
        type="button"
        aria-label="Previous week"
        disabled={!canGoPrev}
        onClick={() => onChange(weekStarts[weekIndex - 1])}
        className={controlClassName}
      >
        ‹
      </button>
      <select
        value={weekStart}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Select week"
        className="h-8 min-w-[11.5rem] rounded border border-border bg-surface px-2 text-[13px] text-foreground focus-visible:border-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
      >
        {weekStarts.map((start) => (
          <option key={start} value={start}>
            {formatWeekRange(start)}
          </option>
        ))}
      </select>
      <button
        type="button"
        aria-label="Next week"
        disabled={!canGoNext}
        onClick={() => onChange(weekStarts[weekIndex + 1])}
        className={controlClassName}
      >
        ›
      </button>
    </div>
  );
}
