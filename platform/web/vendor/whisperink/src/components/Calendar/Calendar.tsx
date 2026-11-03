import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { cn } from "../../cn.js";
import { CaretLeft, CaretRight } from "../../icons.js";
import { formatDate, useDateNames, useLocale } from "../../intl.js";
import { useText } from "../../text.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";
import { IconButton } from "../Button/IconButton.js";
import { addDays, addMonths, fromIso, monthGrid, startOfWeek, today } from "./dates.js";
import { type CalendarMarker, type DateRange, rangePosition, useRangeMarkers } from "./markers.js";

const markerDot = { neutral: "bg-fg-subtle", success: "bg-success", warning: "bg-warning", danger: "bg-danger", info: "bg-info" };

/**
 * Inline month calendar: compact, keyboard-focusable days, markers as dots with tooltips.
 *
 * The keyboard never leaves the days that can be chosen: with `min` or `max`
 * the arrow keys stop at the bound, and the day Tab lands on is always one in
 * the month on show.
 * @category calendar
 */
export function Calendar({ uiId, uiDescription, uiComponentId, uiComponentDescription,
  value,
  onChange,
  markers = [],
  min,
  max,
  range,
  defaultMonth,
  autoFocus = false,
  className,
}: ({
  value: string | null;
  onChange: (value: string) => void;
  markers?: readonly CalendarMarker[];
  min?: string;
  max?: string;
  /** Span to shade, typically the other half of a start/end pair. */
  range?: DateRange;
  /** Month to open on when there is no value yet. */
  defaultMonth?: string;
  /** Puts focus on the current day when the calendar appears, as a popover's content should. */
  autoFocus?: boolean;
  className?: string;
}) & UiMetadataProps) {
  const _ui = uiMetadata("calendar", "Choose a calendar date", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const within = (iso: string) => (min !== undefined && iso < min ? min : max !== undefined && iso > max ? max : iso);
  const monthOf = (iso: string) => { const date = fromIso(iso); return { year: date.getFullYear(), month: date.getMonth() }; };
  const [focused, setFocused] = useState(() => within(value ?? defaultMonth ?? today()));
  const [view, setView] = useState(() => monthOf(focused));
  const gridRef = useRef<HTMLDivElement>(null);
  // A value set from elsewhere — a shortcut, another field — brings its month into view.
  useEffect(() => { if (value) { setFocused(within(value)); setView(monthOf(value)); } }, [value]);
  useEffect(() => { if (autoFocus) gridRef.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus(); }, [autoFocus]);
  const days = monthGrid(view.year, view.month);
  const allMarkers = useRangeMarkers(days[0], days[41], markers);
  const text = useText();
  const at = useLocale();
  const { weekdays } = useDateNames();
  const moveFocus = (target: string) => {
    // A day outside the bounds cannot take focus; going for one would drop focus altogether.
    const iso = within(target);
    setFocused(iso);
    setView(monthOf(iso));
    requestAnimationFrame(() => gridRef.current?.querySelector<HTMLElement>(`[data-date="${iso}"]`)?.focus());
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const moves: Record<string, () => string> = {
      ArrowLeft: () => addDays(focused, -1), ArrowRight: () => addDays(focused, 1),
      ArrowUp: () => addDays(focused, -7), ArrowDown: () => addDays(focused, 7),
      Home: () => startOfWeek(focused), End: () => addDays(startOfWeek(focused), 6),
      PageUp: () => addMonths(focused, event.shiftKey ? -12 : -1), PageDown: () => addMonths(focused, event.shiftKey ? 12 : 1),
    };
    if (moves[event.key]) { event.preventDefault(); moveFocus(moves[event.key]()); }
    else if (event.key.toLowerCase() === "t") { event.preventDefault(); moveFocus(today()); }
  };
  const monthLabel = new Intl.DateTimeFormat(at, { month: "long", year: "numeric" }).format(new Date(view.year, view.month, 1));
  // The focusable day travels with the month, so Tab still finds the grid after paging.
  const shift = (delta: number) => {
    const date = new Date(view.year, view.month + delta, 1);
    setView({ year: date.getFullYear(), month: date.getMonth() });
    setFocused(within(addMonths(focused, delta)));
  };
  const home = within(value ?? defaultMonth ?? today());
  const current = today();
  return (
    <div className={cn("w-72 select-none", className)} {..._ui.attributes}>
      <div className="mb-2 flex items-center justify-between">
        <IconButton label={text.calendar.previousMonth} size="sm" onClick={() => shift(-1)}><CaretLeft /></IconButton>
        <button type="button" className="focus-ring rounded px-2 text-sm font-semibold capitalize hover:bg-subtle" onClick={() => { setView(monthOf(home)); setFocused(home); }}>{monthLabel}</button>
        <IconButton label={text.calendar.nextMonth} size="sm" onClick={() => shift(1)}><CaretRight /></IconButton>
      </div>
      <div className="grid grid-cols-7 text-center text-2xs font-medium uppercase text-fg-subtle">
        {weekdays.map((day) => <span key={day} className="py-1">{day}</span>)}
      </div>
      <div ref={gridRef} className="grid grid-cols-7 gap-y-0.5" role="grid" aria-label={monthLabel} onKeyDown={onKeyDown}>
        {Array.from({ length: 6 }, (_, week) => (
          <div key={days[week * 7]} role="row" className="contents">
            {days.slice(week * 7, week * 7 + 7).map((day) => {
              const inMonth = fromIso(day).getMonth() === view.month;
              const selected = day === value;
              const isFocused = day === focused;
              const disabled = (min !== undefined && day < min) || (max !== undefined && day > max);
              const span = rangePosition(day, range);
              const dayMarkers = allMarkers.filter((marker) => marker.date === day);
              return (
                <button
                  key={day}
                  type="button"
                  role="gridcell"
                  data-date={day}
                  tabIndex={isFocused ? 0 : -1}
                  onFocus={() => setFocused(day)}
                  aria-selected={selected}
                  aria-current={day === current ? "date" : undefined}
                  // What is on a day is said with it; the dots alone say nothing to a screen reader.
                  aria-label={[formatDate(day, { weekday: "long", day: "numeric", month: "long", year: "numeric" }), ...dayMarkers.map((marker) => marker.label)].join(", ")}
                  disabled={disabled}
                  title={dayMarkers.map((marker) => marker.label).join("\n") || undefined}
                  onClick={() => onChange(day)}
                  className={cn(
                    "focus-ring relative mx-auto grid size-9 place-items-center rounded-md text-sm tabular-nums transition-colors",
                    !inMonth && "text-fg-subtle",
                    !selected && !disabled && "hover:bg-subtle",
                    span && !selected && "bg-primary/10",
                    span && span !== "inside" && !selected && "font-semibold ring-1 ring-inset ring-primary/40",
                    day === current && !selected && "font-semibold text-fg ring-1 ring-inset ring-border-strong",
                    selected && "bg-primary font-semibold text-primary-fg",
                    disabled && "cursor-not-allowed opacity-30",
                  )}
                >
                  {fromIso(day).getDate()}
                  {dayMarkers.length > 0 && (
                    <span className="absolute bottom-1 flex gap-0.5">
                      {dayMarkers.slice(0, 3).map((marker, index) => (
                        <span key={index} className={cn("size-1 rounded-full", selected ? "bg-primary-fg" : markerDot[marker.tone])} />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
