import { useMemo, useRef, useState } from "react";
import { cn } from "../../cn.js";
import { CalendarDots, X } from "../../icons.js";
import { formatDate, parseDate, useLocale } from "../../intl.js";
import { useText, type WhisperinkText } from "../../text.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";
import { Button } from "../Button/Button.js";
import { IconButton } from "../Button/IconButton.js";
import { Modal } from "../Modal/Modal.js";
import { Popover } from "../Popover/Popover.js";
import { Calendar } from "./Calendar.js";
import { addDays, addMonths, today } from "./dates.js";
import { DetailedCalendar } from "./DetailedCalendar.js";
import type { CalendarMarker, DatePair, DateRange, DateRole } from "./markers.js";

/**
 * The one date field: typed into like any other field, with a calendar behind
 * its icon. `detail="detailed"` (the default) opens the large calendar in a
 * dialog with week numbers, shortcuts and the markers an application
 * contributed; `detail="simple"` is the compact popover for dense rows.
 *
 * Typing takes whatever the locale writes ("30.9.", "30.09.2026", "300926",
 * "2026-09-30" — see `parseDate`) and commits on Enter or on leaving the
 * field; text that is not a date falls back to the date the field had, so the
 * field never holds a value the form does not know about. ↑ and ↓ step a day,
 * PgUp and PgDn a month, Alt+↓ opens the calendar; emptying the field clears it.
 *
 * `role` says what the field is for and `pair` carries the span it belongs to.
 * The picker shows every date of that span it does not own itself, shades it,
 * refuses days on the wrong side of it, and opens on the month that matters
 * even when its own value is still empty. With `pair.onFill` a freshly chosen
 * start continues straight into the still-empty end.
 * @category calendar
 */
export function DatePicker({ uiId, uiDescription, uiComponentId, uiComponentDescription,
  value,
  onChange,
  markers,
  min,
  max,
  role = "date",
  pair,
  detail = "detailed",
  placeholder,
  title,
  clearable = true,
  disabled,
  invalid,
  id,
  className,
  defaultOpen,
  "aria-describedby": describedBy,
  "aria-invalid": ariaInvalid,
  "aria-required": ariaRequired,
}: ({
  value: string | null;
  onChange: (value: string | null) => void;
  markers?: readonly CalendarMarker[];
  /** Earliest selectable day (ISO); earlier days are disabled in the calendar. */
  min?: string;
  /** Latest selectable day (ISO); later days are disabled in the calendar. */
  max?: string;
  role?: DateRole;
  pair?: DatePair;
  detail?: "detailed" | "simple";
  placeholder?: string;
  title?: string;
  clearable?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
  className?: string;
  /**
   * Opens the calendar on mount (the popover with `detail="simple"`, the dialog
   * otherwise), for documentation. Inside an `OverlayRegion` it stays within the
   * region and takes no focus until it is used.
   */
  defaultOpen?: boolean;
  /** Ids of the hint or error text a `Field` renders for this control. */
  "aria-describedby"?: string;
  /** Set by spreading `Field`'s `control`; counts the same as `invalid`. */
  "aria-invalid"?: boolean;
  "aria-required"?: boolean;
}) & UiMetadataProps) {
  const _ui = uiMetadata("date-picker", "Enter or choose a date", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  const [open, setOpen] = useState(Boolean(defaultOpen) && detail !== "simple");
  /** Whether the popover was opened by hand, in which case the calendar in it takes focus. */
  const [byHand, setByHand] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  /** What has been typed since the field showed its value; null until then, so a value chosen in the calendar shows at once. */
  const [draft, setDraft] = useState<string | null>(null);
  /** A focus that has not had its click finished yet, whose selection must survive the mouse-up. */
  const selecting = useRef(false);
  const at = useLocale();
  const isInvalid = Boolean(invalid ?? ariaInvalid);
  // Once this date is set the picker can move on to the other end of the pair.
  const [filling, setFilling] = useState<"start" | "end" | null>(null);
  const text = useText();
  const startLabel = pair?.startLabel ?? text.calendar.pair.start;
  const endLabel = pair?.endLabel ?? text.calendar.pair.end;
  // This field's own value is its slot in the span, whatever the pair says.
  const spanStart = role === "start" ? value : (pair?.start ?? null);
  const spanEnd = role === "end" ? value : (pair?.end ?? null);
  const active: DateRole = filling ?? role;
  const activeValue = filling ? null : value;
  const step = useMemo(
    () => dateStep({ role: active, value: activeValue, spanStart, spanEnd, startLabel, endLabel, markers, min, max, text }),
    [active, activeValue, endLabel, markers, max, min, spanEnd, spanStart, startLabel, text],
  );
  const display = value ? formatDate(value, { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" }, at) : "";
  /** Held to the bounds the way the calendar holds them, so typing cannot reach what clicking cannot. */
  const within = (iso: string) => (step.min !== undefined && iso < step.min ? step.min : step.max !== undefined && iso > step.max ? step.max : iso);
  /** Takes what was typed: a date, an emptied field, or nothing — in which case the field goes back to its value. */
  const commitText = (typed: string) => {
    setDraft(null);
    if (!typed.trim()) { if (clearable && value) onChange(null); return; }
    const parsed = parseDate(typed, at);
    if (parsed && parsed !== value) onChange(within(parsed));
  };
  const stepBy = (move: (iso: string) => string) => {
    setDraft(null);
    onChange(within(move(value ?? today())));
  };

  const close = () => { setOpen(false); setFilling(null); };

  /** Commits a day; true keeps the picker open to fill the rest of the span. */
  const commit = (next: string | null): boolean => {
    if (filling) {
      if (next) pair?.onFill?.(filling, next);
      setFilling(null);
      return false;
    }
    onChange(next);
    if (!next || !pair?.onFill) return false;
    // A span with only one side is rarely what anyone wanted; offer the other.
    if (role === "start" && !pair.end) { setFilling("end"); return true; }
    if (role === "end" && !pair.start) { setFilling("start"); return true; }
    return false;
  };

  const field = (toggle: () => void, expanded: boolean) => (
    <span className={cn("relative inline-flex w-full", className)} {..._ui.attributes}>
      <input
        ref={input}
        type="text"
        id={id}
        value={draft ?? display}
        placeholder={placeholder ?? text.calendar.roles[role].placeholder}
        disabled={disabled}
        autoComplete="off"
        spellCheck={false}
        aria-describedby={describedBy}
        aria-invalid={isInvalid || undefined}
        aria-required={ariaRequired || undefined}
        onFocus={(event) => {
          // A date is retyped rather than edited, so arriving selects the whole of it.
          selecting.current = true;
          event.currentTarget.select();
        }}
        onMouseUp={(event) => { if (selecting.current) event.preventDefault(); selecting.current = false; }}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={(event) => { selecting.current = false; if (draft !== null) commitText(event.target.value); }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            commitText(event.currentTarget.value);
            // Taken; whatever is typed next replaces it, as when the field was entered.
            requestAnimationFrame(() => input.current?.select());
            return;
          }
          if (event.key === "Escape") {
            // Nothing changed, so the Escape belongs to whatever is around the field, such as a dialog.
            if (draft === null) return;
            event.stopPropagation();
            setDraft(null);
            return;
          }
          if (event.altKey && event.key === "ArrowDown") { event.preventDefault(); if (draft !== null) commitText(event.currentTarget.value); toggle(); return; }
          if (event.altKey || event.ctrlKey || event.metaKey) return;
          const move = event.key === "ArrowUp" ? (iso: string) => addDays(iso, 1)
            : event.key === "ArrowDown" ? (iso: string) => addDays(iso, -1)
            : event.key === "PageUp" ? (iso: string) => addMonths(iso, -1)
            : event.key === "PageDown" ? (iso: string) => addMonths(iso, 1)
            : null;
          if (!move) return;
          event.preventDefault();
          stepBy(move);
        }}
        className={cn("control w-full pl-9 tabular-nums", clearable && value && "pr-9")}
      />
      {/* The icon is the way into the calendar; it sits inside the field where the icon has always been. */}
      <IconButton
        label={text.calendar.roles[role].title}
        size="sm"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={expanded}
        onClick={toggle}
        className="absolute left-1 top-1/2 size-7 -translate-y-1/2 text-fg-subtle"
      >
        <CalendarDots className="size-4" />
      </IconButton>
      {clearable && value && !disabled && (
        // For the pointer only: the keyboard clears by emptying the field. Focus goes to the field, since this button goes with the value.
        <IconButton label={text.calendar.clear} size="sm" tabIndex={-1} onClick={() => { setDraft(null); onChange(null); input.current?.focus(); }} className="absolute right-1 top-1/2 size-7 -translate-y-1/2"><X className="size-3.5" /></IconButton>
      )}
    </span>
  );

  if (detail === "simple") {
    return (
      <Popover
        defaultOpen={defaultOpen}
        className="p-3"
        trigger={({ toggle, open: expanded }) => field(() => { setFilling(null); setByHand(true); toggle(); }, expanded)} {..._ui.props}
      >
        {(dismiss) => (
          <div>
            {filling && <p className="mb-2 text-xs font-medium text-fg-muted">{step.title}</p>}
            <Calendar
              autoFocus={byHand}
              value={step.value}
              onChange={(next) => { if (!commit(next)) dismiss(); }}
              markers={step.markers}
              min={step.min}
              max={step.max}
              range={step.range}
              defaultMonth={step.defaultMonth}
            />
            <div className="mt-2 flex justify-between border-t border-border pt-2">
              <Button variant="ghost" size="sm" onClick={() => { if (!commit(today())) dismiss(); }}>{text.actions.today}</Button>
              {filling ? (
                <Button variant="ghost" size="sm" onClick={() => { setFilling(null); dismiss(); }}>{text.actions.skip}</Button>
              ) : (
                value && clearable ? <Button variant="ghost" size="sm" onClick={() => { onChange(null); dismiss(); }}>{text.actions.remove}</Button> : null
              )}
            </div>
          </div>
        )}
      </Popover>
    );
  }

  return (
    <>
      {field(() => { setFilling(null); setOpen(true); }, open)}
      <Modal
        open={open}
        onClose={close}
        title={title && !filling ? title : step.title}
        description={step.description}
        size="xl"
        footer={
          <>
            {filling ? (
              <Button variant="ghost" onClick={close}>{text.actions.skip}</Button>
            ) : (
              clearable ? <Button variant="ghost" disabled={!value} onClick={() => { onChange(null); close(); }}>{text.actions.remove}</Button> : null
            )}
            <Button variant="outline" onClick={close}>{text.actions.close}</Button>
          </>
        } {..._ui.props}
      >
        <DetailedCalendar
          autoFocus
          value={step.value}
          onChange={(next) => { if (!commit(next)) close(); }}
          markers={step.markers}
          min={step.min}
          max={step.max}
          range={step.range}
          defaultMonth={step.defaultMonth}
        />
      </Modal>
    </>
  );
}

/** Everything one pass of the picker shows: context, bounds, span and titles. */
function dateStep({
  role,
  value,
  spanStart,
  spanEnd,
  startLabel,
  endLabel,
  markers,
  min,
  max,
  text,
}: {
  role: DateRole;
  value: string | null;
  spanStart: string | null;
  spanEnd: string | null;
  startLabel: string;
  endLabel: string;
  markers?: readonly CalendarMarker[];
  min?: string;
  max?: string;
  text: WhisperinkText;
}) {
  // A field is never its own context; every other date of the span is shown.
  const contextStart = role === "start" ? null : spanStart;
  const contextEnd = role === "end" ? null : spanEnd;
  // An end never precedes its start, a start never follows its end, and work
  // is not due before it begins. A deadline may still fall past the planned end.
  const lower = role === "end" || role === "deadline" ? laterOf(min, contextStart) : min;
  const upper = role === "start" ? earlierOf(max, contextEnd) : max;
  const range: DateRange =
    role === "start"
      ? { start: value, end: contextEnd }
      : role === "end"
        ? { start: contextStart, end: value }
        : { start: contextStart, end: contextEnd };
  const context: CalendarMarker[] = [];
  if (contextStart) context.push({ date: contextStart, tone: "neutral", label: startLabel, kind: "project-start" });
  if (contextEnd) context.push({ date: contextEnd, tone: "neutral", label: endLabel, kind: "project-end" });
  const described = context.map(
    (marker) => `${marker.label}: ${formatDate(marker.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`,
  );
  return {
    value,
    min: lower,
    max: upper,
    range,
    markers: context.length === 0 ? markers : [...(markers ?? []), ...context],
    // With no value of its own the field opens where the span already is.
    defaultMonth: contextStart ?? contextEnd ?? undefined,
    title: text.calendar.roles[role].title,
    description:
      described.length > 0
        ? described.join(" · ")
        : value
          ? formatDate(value, { weekday: "long", day: "numeric", month: "long", year: "numeric" })
          : text.calendar.hint,
  };
}

function laterOf(left: string | undefined, right: string | null): string | undefined {
  if (!right) return left;
  return !left || right > left ? right : left;
}

function earlierOf(left: string | undefined, right: string | null): string | undefined {
  if (!right) return left;
  return !left || right < left ? right : left;
}
