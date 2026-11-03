import { cn } from "../../cn.js";
import { useText } from "../../text.js";
import type { Tone } from "../../tone.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

export type AgendaTask = {
  id: string;
  title: string;
  project: string;
  /** Links the project line to its page; keeps middle-click and "open in new tab". */
  projectHref?: string;
  done?: boolean;
  disabled?: boolean;
  tone?: Tone;
};

/**
 * Week board of tasks. `onToggle` makes the checkboxes controlled; without it
 * they render read-only, so the board never shows a change it did not make.
 * @category data
 */
export function AgendaBoard({ uiId, uiDescription, uiComponentId, uiComponentDescription, days, tasks, todayIndex, onToggle, emptyLabel, className }: ({ days: readonly { label: string; date: number }[]; tasks: Record<number, AgendaTask[]>; todayIndex: number; onToggle?: (task: AgendaTask, done: boolean) => void; emptyLabel?: string; className?: string }) & UiMetadataProps) {
  const _ui = uiMetadata("agenda-board", "Show tasks by day", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const text = useText();
  return (
    <div className={cn("scrollbar-thin overflow-x-auto", className)} {..._ui.attributes}>
      <div className="grid min-w-[900px] grid-cols-7 divide-x divide-border">
        {days.map((day, index) => (
          <div key={day.label} className={cn(index >= 5 && "bg-subtle/40")}>
            <div className={cn("flex items-baseline justify-between border-b border-border px-3 py-2", index === todayIndex && "border-b-2 border-b-primary")}>
              <span className="text-2xs font-semibold uppercase text-fg-subtle">{day.label}</span>
              <span className={cn("text-sm font-semibold tabular-nums", index === todayIndex ? "text-fg" : "text-fg-muted")}>{day.date}</span>
            </div>
            <div className="grid min-h-36 content-start gap-1.5 p-2">
              {(tasks[index] ?? []).map((task) => (
                <div key={task.id} className="group rounded-md border border-border bg-surface p-2 shadow-xs transition-colors hover:border-border-strong">
                  <label className={cn("flex items-start gap-2", onToggle && !task.disabled ? "cursor-pointer" : "cursor-default")}>
                    <input
                      type="checkbox"
                      className="mt-0.5 size-3.5 accent-[rgb(var(--primary))]"
                      checked={Boolean(task.done)}
                      disabled={task.disabled}
                      readOnly={!onToggle}
                      onChange={onToggle ? (event) => onToggle(task, event.target.checked) : undefined}
                    />
                    <span className={cn("min-w-0 block truncate text-sm", task.done && "text-fg-subtle line-through")}>{task.title}</span>
                  </label>
                  {task.projectHref ? (
                    <a href={task.projectHref} className="focus-ring mt-1 block truncate rounded text-2xs text-fg-muted hover:text-fg">{task.project}</a>
                  ) : (
                    <span className="mt-1 block truncate text-2xs text-fg-muted">{task.project}</span>
                  )}
                </div>
              ))}
              {!(tasks[index] ?? []).length && <p className="py-4 text-center text-2xs text-fg-subtle">{emptyLabel ?? text.agenda.empty}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
