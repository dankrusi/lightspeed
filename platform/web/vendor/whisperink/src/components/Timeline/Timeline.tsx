import { cn } from "../../cn.js";
import { Flag } from "../../icons.js";
import { useText } from "../../text.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

export type TimelineRow = { id: string; title: string; meta?: string; depth?: number; start: number; end: number; kind?: "root" | "child" | "derived"; deadline?: number; children?: [number, number][] };

/**
 * Gantt-style timeline. Positions are percentages of the visible range.
 * @category data
 */
export function Timeline({ uiId, uiDescription, uiComponentId, uiComponentDescription, rows, weeks, todayAt, className }: ({ rows: readonly TimelineRow[]; weeks: readonly string[]; todayAt: number; className?: string }) & UiMetadataProps) {
  const _ui = uiMetadata("timeline", "Show events over time", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const text = useText();
  return (
    <div className={cn("scrollbar-thin overflow-x-auto", className)} {..._ui.attributes}>
      <div className="min-w-[840px]">
        <div className="grid grid-cols-[240px_1fr] border-b border-border">
          <div className="flex items-end px-4 py-2 text-xs font-medium text-fg-muted">{text.timeline.project}</div>
          {/* Tall enough for the today tag above and the week labels below, whatever their length. */}
          <div className="relative h-12" style={{ backgroundImage: "linear-gradient(to right, rgb(var(--border) / 0.6) 1px, transparent 1px)", backgroundSize: `${100 / (weeks.length * 7)}% 100%` }}>
            {weeks.map((week, index) => (
              <div key={week} className="absolute inset-y-0 border-l border-border" style={{ left: `${(index / weeks.length) * 100}%`, width: `${100 / weeks.length}%` }}>
                <span className="absolute inset-x-0 bottom-2 truncate px-1 text-center text-2xs font-medium text-fg-muted">{week}</span>
              </div>
            ))}
            <div className="absolute inset-y-0 z-10 border-l-2 border-info" style={{ left: `${todayAt}%` }}>
              <span className="absolute left-1.5 top-1 rounded bg-info px-1 text-2xs font-semibold text-on-status">{text.timeline.today}</span>
            </div>
          </div>
        </div>
        {rows.map((row) => (
          <div key={row.id} className="grid grid-cols-[240px_1fr] border-b border-border last:border-0">
            <div className="flex min-w-0 items-center gap-2 py-3 pr-3" style={{ paddingLeft: `${16 + (row.depth ?? 0) * 20}px` }}>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{row.title}</span>
                {row.meta && <span className="block truncate text-2xs text-fg-muted">{row.meta}</span>}
              </span>
            </div>
            <div className="relative h-14" style={{ backgroundImage: "linear-gradient(to right, rgb(var(--border) / 0.6) 1px, transparent 1px)", backgroundSize: `${100 / (weeks.length * 7)}% 100%` }}>
              <div className="absolute inset-y-0 border-l border-info/40" style={{ left: `${todayAt}%` }} />
              {row.children?.map(([start, end]) => (
                <div key={start} className="absolute top-9 h-1 rounded-full bg-fg/20" style={{ left: `${start}%`, width: `${end - start}%` }} />
              ))}
              <div
                className={cn(
                  "absolute top-5 h-3.5 rounded-full",
                  row.kind === "child" && "bg-fg/45",
                  (!row.kind || row.kind === "root") && "bg-fg/80",
                  row.kind === "derived" && "border border-dashed border-fg/40 bg-fg/10",
                )}
                style={{ left: `${row.start}%`, width: `${row.end - row.start}%` }}
              />
              {row.deadline !== undefined && (
                <span className="absolute top-1 z-[2] -translate-x-1/2 text-warning" style={{ left: `${row.deadline}%` }} title={text.timeline.deadline}>
                  <Flag className="size-3.5" fill="currentColor" />
                  <span className="absolute left-1/2 top-3.5 h-9 border-l border-dashed border-warning/70" />
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
