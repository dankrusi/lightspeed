import { type KeyboardEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../../cn.js";
import { CalendarDots, CaretDoubleLeft, CaretDoubleRight, CaretLeft, CaretRight, Flag, ListChecks, Play, Square } from "../../icons.js";
import { formatDate, useDateNames } from "../../intl.js";
import { useText, type WhisperinkText } from "../../text.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";
import { Button } from "../Button/Button.js";
import { IconButton } from "../Button/IconButton.js";
import { NumberInput } from "../NumberInput/NumberInput.js";
import { Popover } from "../Popover/Popover.js";
import { addDays, addMonths, fromIso, isoDate, isoWeek, monthGrid, startOfWeek, today } from "./dates.js";
import { type CalendarMarker, type DateRange, type MarkerKind, rangePosition, useRangeMarkers } from "./markers.js";

function endOfMonth(iso: string): string {
  const date = fromIso(iso);
  return isoDate(new Date(date.getFullYear(), date.getMonth() + 1, 0, 12));
}
function nextWeekday(iso: string, weekday: number): string {
  const date = fromIso(iso);
  const delta = ((weekday - date.getDay() + 7) % 7) || 7;
  return addDays(iso, delta);
}
function firstOf(year: number, month: number): string {
  return isoDate(new Date(year, month, 1, 12));
}

const kindIcon: Record<MarkerKind, typeof Flag> = { item: CalendarDots, task: ListChecks, deadline: Flag, "project-start": Play, "project-end": Square };
const toneChip = {
  neutral: "bg-subtle text-fg-muted",
  success: "bg-success-soft text-success-fg",
  warning: "bg-warning-soft text-warning-fg",
  danger: "bg-danger-soft text-danger-fg",
  info: "bg-info-soft text-info-fg",
};

/** Shortcut chips above the grid; each resolves to a target ISO date. */
const shortcuts: readonly { key: keyof WhisperinkText["calendar"]["shortcuts"]; resolve: (viewStart: string) => string }[] = [
  { key: "today", resolve: () => today() },
  { key: "tomorrow", resolve: () => addDays(today(), 1) },
  { key: "nextMonday", resolve: () => nextWeekday(today(), 1) },
  { key: "inOneWeek", resolve: () => addDays(today(), 7) },
  { key: "inTwoWeeks", resolve: () => addDays(today(), 14) },
  { key: "endOfMonth", resolve: (viewStart) => endOfMonth(viewStart) },
  { key: "inOneMonth", resolve: () => addMonths(today(), 1) },
];

function Key({ children }: { children: ReactNode }) {
  return <kbd className="inline-flex h-4 min-w-4 items-center justify-center rounded border border-border bg-subtle px-1 font-sans text-2xs text-fg-muted">{children}</kbd>;
}

/**
 * Large month view with week numbers, marker chips, a month/year picker,
 * shortcut chips, hover preview, and complete keyboard navigation.
 * Clicking a day commits immediately; the footer previews the hovered day.
 * @category calendar
 */
export function DetailedCalendar({ uiId, uiDescription, uiComponentId, uiComponentDescription,
  value,
  onChange,
  markers = [],
  min,
  max,
  range,
  defaultMonth,
  maxChips = 3,
  autoFocus = false,
  className,
}: ({
  value: string | null;
  onChange: (value: string | null) => void;
  markers?: readonly CalendarMarker[];
  min?: string;
  max?: string;
  /** Span to shade, typically the other half of a start/end pair. */
  range?: DateRange;
  /** Month to open on when there is no value yet. */
  defaultMonth?: string;
  maxChips?: number;
  /** In a `Modal`, makes the current day the place the dialog puts focus when it opens, so the arrow keys work from the first keystroke. */
  autoFocus?: boolean;
  className?: string;
}) & UiMetadataProps) {
  const _ui = uiMetadata("detailed-calendar", "Explore dates and calendar items", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const current = today();
  const anchor = value ?? defaultMonth ?? current;
  const [focused, setFocused] = useState(anchor);
  const [view, setView] = useState(() => { const date = fromIso(anchor); return { year: date.getFullYear(), month: date.getMonth() }; });
  const [hovered, setHovered] = useState<string | null>(null);
  const grid = useRef<HTMLDivElement>(null);
  const viewStart = firstOf(view.year, view.month);
  const days = useMemo(() => monthGrid(view.year, view.month), [view]);
  const weeks = useMemo(() => Array.from({ length: 6 }, (_, index) => days.slice(index * 7, index * 7 + 7)), [days]);
  const allMarkers = useRangeMarkers(days[0], days[41], markers);
  const text = useText();
  const { weekdays, months } = useDateNames();
  const byDate = useMemo(() => {
    const map = new Map<string, CalendarMarker[]>();
    allMarkers.forEach((marker) => map.set(marker.date, [...(map.get(marker.date) ?? []), marker]));
    return map;
  }, [allMarkers]);
  const allowed = (day: string) => (min === undefined || day >= min) && (max === undefined || day <= max);
  const showMonthOf = (iso: string) => { const date = fromIso(iso); setView({ year: date.getFullYear(), month: date.getMonth() }); };
  const focus = (iso: string) => {
    setFocused(iso);
    showMonthOf(iso);
    requestAnimationFrame(() => grid.current?.querySelector<HTMLElement>(`[data-date="${iso}"]`)?.focus());
  };
  const commit = (iso: string) => { if (allowed(iso)) { onChange(iso); setFocused(iso); showMonthOf(iso); } };
  useEffect(() => { if (value) { setFocused(value); showMonthOf(value); } }, [value]);
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, () => string> = {
      ArrowLeft: () => addDays(focused, -1),
      ArrowRight: () => addDays(focused, 1),
      ArrowUp: () => addDays(focused, -7),
      ArrowDown: () => addDays(focused, 7),
      Home: () => startOfWeek(focused),
      End: () => addDays(startOfWeek(focused), 6),
      PageUp: () => addMonths(focused, event.shiftKey ? -12 : -1),
      PageDown: () => addMonths(focused, event.shiftKey ? 12 : 1),
    };
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (moves[event.key]) { event.preventDefault(); focus(moves[event.key]()); return; }
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); commit(focused); }
    if (event.key.toLowerCase() === "t") { event.preventDefault(); focus(current); }
  };
  const preview = hovered ?? focused;
  const monthLabel = `${months[view.month]} ${view.year}`;
  return (
    <div className={cn("flex min-h-0 flex-col", className)} {..._ui.attributes}>
      <div className="flex flex-wrap items-center gap-2 pb-3">
        <div className="flex items-center gap-0.5">
          <IconButton label={text.calendar.previousYear} size="sm" onClick={() => setView((state) => ({ ...state, year: state.year - 1 }))}><CaretDoubleLeft /></IconButton>
          <IconButton label={text.calendar.previousMonth} size="sm" onClick={() => showMonthOf(addMonths(viewStart, -1))}><CaretLeft /></IconButton>
          <Popover
            align="start"
            className="w-80 p-3"
            trigger={({ toggle, open }) => (
              <button type="button" onClick={toggle} aria-haspopup="dialog" aria-expanded={open} title={text.calendar.pickMonthAndYear} className="focus-ring h-8 rounded px-2.5 text-base font-semibold capitalize hover:bg-subtle">
                {monthLabel}
              </button>
            )}
          >
            {(close) => <MonthYearPicker year={view.year} month={view.month} months={months} text={text} onPick={(year, month) => { setView({ year, month }); close(); }} />}
          </Popover>
          <IconButton label={text.calendar.nextMonth} size="sm" onClick={() => showMonthOf(addMonths(viewStart, 1))}><CaretRight /></IconButton>
          <IconButton label={text.calendar.nextYear} size="sm" onClick={() => setView((state) => ({ ...state, year: state.year + 1 }))}><CaretDoubleRight /></IconButton>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          {shortcuts.map((shortcut) => {
            const target = shortcut.resolve(viewStart);
            return (
              <button
                key={shortcut.key}
                type="button"
                onClick={() => commit(target)}
                onMouseEnter={() => setHovered(target)}
                onMouseLeave={() => setHovered(null)}
                disabled={!allowed(target)}
                title={formatDate(target, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                className={cn(
                  "focus-ring h-7 rounded-full border px-2.5 text-xs font-medium transition-colors disabled:opacity-40",
                  value === target ? "border-primary bg-primary text-primary-fg" : "border-border bg-surface hover:border-border-strong hover:bg-subtle",
                )}
              >
                {text.calendar.shortcuts[shortcut.key]}
              </button>
            );
          })}
        </div>
      </div>

      <div ref={grid} role="grid" aria-label={monthLabel} onKeyDown={onKeyDown} className="min-h-0 flex-1 overflow-hidden rounded-[var(--card-radius)] border border-border bg-surface">
        <div role="row" className="grid grid-cols-[40px_repeat(7,minmax(0,1fr))] border-b border-border bg-subtle/60 text-2xs font-semibold uppercase tracking-wider text-fg-subtle">
          <span role="columnheader" className="px-2 py-2 text-center">{text.calendar.weekAbbreviation}</span>
          {weekdays.map((day, index) => <span key={day} role="columnheader" className={cn("px-2 py-2", index >= 5 && "text-fg-subtle/70")}>{day}</span>)}
        </div>
        {weeks.map((week) => (
          <div key={week[0]} role="row" className="grid grid-cols-[40px_repeat(7,minmax(0,1fr))] border-b border-border last:border-0">
            <span role="rowheader" aria-label={text.calendar.weekNumber(isoWeek(week[0]))} onClick={() => focus(week[0])} title={text.calendar.weekNumber(isoWeek(week[0]))} className="cursor-pointer border-r border-border bg-subtle/40 px-1 py-2 text-center text-2xs font-medium tabular-nums text-fg-subtle hover:bg-subtle hover:text-fg">
              {isoWeek(week[0])}
            </span>
            {week.map((day, index) => {
              const inMonth = fromIso(day).getMonth() === view.month;
              const selected = day === value;
              const isToday = day === current;
              const isFocused = day === focused;
              const disabled = !allowed(day);
              const span = rangePosition(day, range);
              const items = byDate.get(day) ?? [];
              return (
                <div
                  key={day}
                  role="gridcell"
                  data-date={day}
                  data-autofocus={autoFocus && isFocused ? "" : undefined}
                  tabIndex={isFocused ? 0 : -1}
                  aria-selected={selected}
                  aria-current={isToday ? "date" : undefined}
                  aria-disabled={disabled || undefined}
                  aria-label={[formatDate(day, { weekday: "long", day: "numeric", month: "long", year: "numeric" }), ...items.map((marker) => marker.label)].join(", ")}
                  onClick={() => !disabled && commit(day)}
                  onMouseEnter={() => setHovered(day)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setFocused(day)}
                  className={cn(
                    "group relative flex min-h-[82px] cursor-pointer flex-col gap-1 border-r border-border p-1.5 text-left outline-none transition-colors last:border-r-0",
                    index >= 5 && "bg-subtle/40",
                    !disabled && !selected && "hover:bg-subtle/80",
                    span && !selected && "bg-primary/[0.05]",
                    selected && "bg-primary/[0.06]",
                    "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgb(var(--ring))]/50",
                    disabled && "cursor-not-allowed opacity-35",
                  )}
                >
                  {span && (
                    <span
                      aria-hidden="true"
                      className={cn(
                        // Rails run through the week; the caps only close where
                        // the span actually starts and ends.
                        // Just outside the cell's padding box, so a cap never
                        // crowds the day number or its chip. The caps curve at
                        // 14px: the day circle's 12px radius plus this border,
                        // so a cap and the selected day share one curvature.
                        "pointer-events-none absolute inset-y-1 border-y-2 border-primary",
                        span === "start" || span === "only" ? "left-1 rounded-l-[14px] border-l-2" : "-left-px",
                        span === "end" || span === "only" ? "right-1 rounded-r-[14px] border-r-2" : "-right-px",
                      )}
                    />
                  )}
                  <span className="relative flex items-center justify-between gap-1">
                    <span
                      className={cn(
                        "grid h-6 min-w-6 place-items-center rounded-full px-1 text-sm font-semibold tabular-nums",
                        selected ? "bg-primary text-primary-fg" : isToday ? "text-info-fg" : inMonth ? "text-fg" : "text-fg-subtle",
                      )}
                    >
                      {fromIso(day).getDate()}
                    </span>
                    {isToday && <span className="rounded bg-info px-1 text-2xs font-semibold text-on-status">{text.actions.today}</span>}
                    {selected && !isToday && <span className="text-2xs font-medium text-fg-muted">{text.calendar.selected}</span>}
                  </span>
                  {items.length > 0 && (
                    <span className="relative grid gap-0.5">
                      {items.slice(0, maxChips).map((marker, position) => {
                        const Icon = kindIcon[marker.kind ?? "item"];
                        const tooltip = [text.calendar.kinds[marker.kind ?? "item"], marker.context, marker.label].filter(Boolean).join(" · ");
                        return (
                          <span key={position} title={tooltip} className={cn("flex h-5 items-center gap-1 truncate rounded px-1 text-2xs font-medium", toneChip[marker.tone], !inMonth && "opacity-60", marker.done && "line-through opacity-60")}>
                            <Icon className="size-3 shrink-0" />
                            <span className="truncate">{marker.label}</span>
                          </span>
                        );
                      })}
                      {items.length > maxChips && (
                        <span title={items.slice(maxChips).map((marker) => marker.label).join("\n")} className="px-1 text-2xs font-medium text-fg-muted">{text.calendar.more(items.length - maxChips)}</span>
                      )}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-3 text-xs text-fg-muted">
        <span className="flex items-center gap-1.5"><span className="size-3 rounded-full bg-primary" />{text.calendar.selected}</span>
        {rangePosition(range?.start ?? "", range) !== null && (
          <span className="flex items-center gap-1.5"><span className="h-3 w-6 rounded-[4px] border-2 border-primary" />{text.calendar.range}</span>
        )}
        <span className="hidden items-center gap-1 xl:flex"><Key>←</Key><Key>→</Key><Key>↑</Key><Key>↓</Key> {text.calendar.keyboard.day} · <Key>PgUp</Key><Key>PgDn</Key> {text.calendar.keyboard.month} · <Key>⇧</Key>+<Key>PgUp</Key> {text.calendar.keyboard.year} · <Key>T</Key> {text.calendar.keyboard.today} · <Key>↵</Key> {text.calendar.keyboard.select}</span>
        <span className="ml-auto flex items-center gap-2 text-sm text-fg">
          {value ? <span>{text.calendar.current}{" "}<strong className="font-semibold">{formatDate(value, { weekday: "short", day: "numeric", month: "long", year: "numeric" })}</strong></span> : <span className="text-fg-muted">{text.calendar.noDate}</span>}
          {preview !== value && <span className="text-fg-muted">→ {formatDate(preview, { weekday: "short", day: "numeric", month: "long" })}</span>}
        </span>
      </div>
    </div>
  );
}

/** Month grid with year stepping, a typed year, and nearby-year chips. */
function MonthYearPicker({ year, month, months, text, onPick }: { year: number; month: number; months: string[]; text: WhisperinkText; onPick: (year: number, month: number) => void }) {
  const [draftYear, setDraftYear] = useState(year);
  const now = new Date();
  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-1">
        <IconButton label={text.calendar.yearBack} size="sm" onClick={() => setDraftYear((value) => value - 1)}><CaretLeft /></IconButton>
        {/* A year is typed digit by digit, and every step on the way is out of range; this field shows what is typed regardless. */}
        <NumberInput value={draftYear} onChange={setDraftYear} min={1900} max={2200} label={text.calendar.year} className="h-8 w-24 !text-center text-base font-semibold" />
        <IconButton label={text.calendar.yearForward} size="sm" onClick={() => setDraftYear((value) => value + 1)}><CaretRight /></IconButton>
        <Button variant="ghost" size="sm" className="ml-auto" onClick={() => onPick(now.getFullYear(), now.getMonth())}>{text.actions.today}</Button>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {months.map((name, index) => {
          const active = draftYear === year && index === month;
          const isCurrent = draftYear === now.getFullYear() && index === now.getMonth();
          return (
            <button
              key={name}
              type="button"
              onClick={() => onPick(draftYear, index)}
              className={cn("focus-ring h-9 rounded text-sm capitalize transition-colors", active ? "bg-primary font-semibold text-primary-fg" : "hover:bg-subtle", isCurrent && !active && "font-semibold text-info-fg")}
            >
              {name.slice(0, 3)}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-1 border-t border-border pt-2">
        {[-2, -1, 0, 1, 2].map((offset) => (
          <button key={offset} type="button" onClick={() => setDraftYear(now.getFullYear() + offset)} className={cn("focus-ring h-6 rounded-full px-2 text-xs tabular-nums", draftYear === now.getFullYear() + offset ? "bg-subtle font-semibold" : "text-fg-muted hover:bg-subtle")}>
            {now.getFullYear() + offset}
          </button>
        ))}
      </div>
    </div>
  );
}
